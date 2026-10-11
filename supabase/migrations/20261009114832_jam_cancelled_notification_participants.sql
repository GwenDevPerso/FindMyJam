-- Jam cancelled: send the participants along with the notification payload.
--
-- `jams_cancelled_notification` is a BEFORE DELETE trigger and pg_net only sends the HTTP request after the
-- transaction commits. By then the `jam_participants` rows of the jam are gone (ON DELETE CASCADE), so the
-- `send-jam-cancelled-notification` edge function could no longer find them and only the creator was
-- notified. The rows still exist while the BEFORE DELETE trigger runs, so they are collected here and sent
-- as `participant_ids` (jsonb array of user ids, `[]` when the jam has no participant).
--
-- Only the function body changes; the trigger created in the baseline keeps pointing at it.
CREATE OR REPLACE FUNCTION public.trigger_jam_cancelled_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_ids jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(jp.user_id), '[]'::jsonb)
  INTO v_participant_ids
  FROM public.jam_participants AS jp
  WHERE jp.jam_id = OLD.id;

  PERFORM public.invoke_notification_edge_function(
    'send-jam-cancelled-notification',
    jsonb_build_object(
      'jam_id', OLD.id,
      'title', OLD.title,
      'starts_at', OLD.starts_at,
      'creator_id', OLD.creator_id,
      'participant_ids', v_participant_ids
    )
  );

  RETURN OLD;
END;
$$;
