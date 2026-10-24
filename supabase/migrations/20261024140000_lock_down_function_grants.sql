-- Lock down function grants and authenticate calls to the notification Edge Functions.
--
-- Supabase's default privileges grant EXECUTE on every new function in `public` to anon and authenticated, so the
-- `REVOKE ... FROM PUBLIC` of the earlier migrations left these functions callable through /rest/v1/rpc/. The worst one
-- was invoke_notification_edge_function: anyone, signed in or not, could make the database call any Edge Function
-- with the service role key.
--
-- The Edge Functions now require a service role JWT (verify_jwt = true plus a role check in
-- `_shared/supabase.ts`), so the starting-soon cron job, which sent no Authorization header, is rescheduled with one.
-- Deploy the functions together with this migration (see "Migrations" in DATABASE.md).

-- Service only: called by the notification triggers (as their owner) or by the Edge Functions (service_role).
REVOKE EXECUTE ON FUNCTION public.invoke_notification_edge_function(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invoke_notification_edge_function(text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_jams_starting_soon(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_jams_starting_soon(integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.find_new_jam_notification_recipients(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_new_jam_notification_recipients(uuid) TO service_role;

-- Trigger functions: the privilege is only checked when the trigger is created, never when it fires, so nobody needs
-- to call them directly.
REVOKE EXECUTE ON FUNCTION public.check_jam_capacity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_jam_participant_not_creator() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_profile_notification_preferences() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_jam_message_created_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_chat_message_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_friend_accepted_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_friend_request_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_jam_cancelled_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_jam_updated_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_new_jam_notification() FROM PUBLIC, anon, authenticated;

-- SECURITY DEFINER helpers used by RLS policies and the app: signed-in users only.
REVOKE EXECUTE ON FUNCTION public.is_jam_creator(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_jam_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_jam_participant_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_jam_creator(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_jam_participant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_jam_participant_count(uuid) TO authenticated, service_role;

-- Same job, now authenticated like invoke_notification_edge_function (cron.schedule replaces a job of the same name).
SELECT cron.schedule(
  'jam-starting-soon',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := rtrim(private.get_vault_secret('project_url'), '/') || '/functions/v1/send-jam-starting-soon-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || private.get_vault_secret('service_role_key')
    ),
    timeout_milliseconds := 1000
  );
  $cron$
);
