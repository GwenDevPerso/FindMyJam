import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseUrl === undefined || serviceRoleKey === undefined) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Whether the request carries a service role JWT, as sent by `invoke_notification_edge_function` and the cron jobs.
 * Relies on `verify_jwt = true` (supabase/config.toml): the gateway has already checked the signature, so reading the
 * role claim is enough to turn away the anon key or a user's session.
 */
export function isServiceRoleRequest(request: Request): boolean {
  const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
  const payload = token?.split('.')[1];

  if (payload === undefined) {
    return false;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { role?: unknown };

    return claims.role === 'service_role';
  } catch {
    return false;
  }
}

export function createJsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createErrorResponse(message: string, status = 500): Response {
  return createJsonResponse({ error: message }, status);
}
