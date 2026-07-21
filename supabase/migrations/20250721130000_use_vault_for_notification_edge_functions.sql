-- Use Supabase Vault for edge function credentials (works on hosted Supabase).
-- Secrets must be created manually (Dashboard or SQL Editor), never in migrations:
--   vault.create_secret('https://<project-ref>.supabase.co', 'project_url', '...');
--   vault.create_secret('<service-role-key>', 'service_role_key', '...');

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_vault_secret(p_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vault
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = p_name
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.get_vault_secret(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_vault_secret(text) TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.invoke_notification_edge_function(
  p_function_name text,
  p_body jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, private
AS $$
DECLARE
  v_base_url text;
  v_service_role_key text;
  v_url text;
  v_request_id bigint;
BEGIN
  v_base_url := coalesce(
    private.get_vault_secret('project_url'),
    current_setting('app.settings.supabase_url', true)
  );
  v_service_role_key := coalesce(
    private.get_vault_secret('service_role_key'),
    current_setting('app.settings.service_role_key', true)
  );

  IF v_base_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE WARNING 'Notification edge function skipped: missing Vault secrets (project_url, service_role_key)';
    RETURN NULL;
  END IF;

  v_url := rtrim(v_base_url, '/') || '/functions/v1/' || p_function_name;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := p_body
  )
  INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invoke_notification_edge_function(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invoke_notification_edge_function(text, jsonb) TO postgres, service_role;
