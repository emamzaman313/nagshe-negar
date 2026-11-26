-- Keep the SECURITY DEFINER implementation outside the exposed public API schema.
-- The public RPC becomes SECURITY INVOKER and delegates to this private function.
CREATE OR REPLACE FUNCTION qnr_private.qnr_admin_moderate_social_content_secure(
  p_target_type text,
  p_target_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_new_status text;
  v_audit_action text;
  v_reason text := NULLIF(btrim(COALESCE(p_reason, '')), '');
BEGIN
  IF v_actor IS NULL OR NOT qnr_private.qnr_is_admin() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_target_id IS NULL OR p_target_type IS NULL OR p_target_type NOT IN ('post', 'comment', 'report') THEN
    RAISE EXCEPTION 'invalid_moderation_target' USING ERRCODE = '22023';
  END IF;
  IF p_action IS NULL OR length(COALESCE(v_reason, '')) > 1000 THEN
    RAISE EXCEPTION 'invalid_moderation_action_or_reason' USING ERRCODE = '22023';
  END IF;

  IF p_target_type = 'post' THEN
    IF p_action NOT IN ('approve', 'reject', 'hide') THEN
      RAISE EXCEPTION 'invalid_post_action' USING ERRCODE = '22023';
    END IF;
    v_new_status := CASE p_action WHEN 'approve' THEN 'published' WHEN 'reject' THEN 'rejected' ELSE 'hidden' END;
    IF p_action IN ('reject', 'hide') AND v_reason IS NULL THEN
      RAISE EXCEPTION 'moderation_reason_required' USING ERRCODE = '22023';
    END IF;
    UPDATE public.qnr_social_posts
       SET status = v_new_status,
           moderation_note = CASE WHEN p_action = 'approve' THEN NULL ELSE v_reason END,
           published_at = CASE WHEN p_action = 'approve' THEN now() ELSE NULL END,
           updated_at = now()
     WHERE id = p_target_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'moderation_target_not_found' USING ERRCODE = 'P0002'; END IF;
    v_audit_action := 'social_post_' || p_action;

  ELSIF p_target_type = 'comment' THEN
    IF p_action NOT IN ('hide', 'restore') THEN
      RAISE EXCEPTION 'invalid_comment_action' USING ERRCODE = '22023';
    END IF;
    IF p_action = 'hide' AND v_reason IS NULL THEN
      RAISE EXCEPTION 'moderation_reason_required' USING ERRCODE = '22023';
    END IF;
    v_new_status := CASE p_action WHEN 'hide' THEN 'hidden' ELSE 'published' END;
    UPDATE public.qnr_social_comments SET status = v_new_status, updated_at = now() WHERE id = p_target_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'moderation_target_not_found' USING ERRCODE = 'P0002'; END IF;
    v_audit_action := 'social_comment_' || p_action;

  ELSE
    IF p_action NOT IN ('review', 'dismiss') THEN
      RAISE EXCEPTION 'invalid_report_action' USING ERRCODE = '22023';
    END IF;
    v_new_status := CASE p_action WHEN 'review' THEN 'reviewed' ELSE 'dismissed' END;
    UPDATE public.qnr_social_reports SET status = v_new_status, reviewed_by = v_actor, reviewed_at = now() WHERE id = p_target_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'moderation_target_not_found' USING ERRCODE = 'P0002'; END IF;
    v_audit_action := 'social_report_' || p_action;
  END IF;

  INSERT INTO public.qnr_audit_log(actor_id, action, subject_type, subject_id, reason, details)
  VALUES (v_actor, v_audit_action, 'social_' || p_target_type, p_target_id::text, v_reason,
          jsonb_build_object('status', v_new_status, 'source', 'admin_moderation'));
  RETURN jsonb_build_object('ok', true, 'target_type', p_target_type, 'target_id', p_target_id, 'status', v_new_status);
END;
$function$;

REVOKE ALL ON FUNCTION qnr_private.qnr_admin_moderate_social_content_secure(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION qnr_private.qnr_admin_moderate_social_content_secure(text, uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.qnr_admin_moderate_social_content(
  p_target_type text,
  p_target_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $wrapper$
  SELECT qnr_private.qnr_admin_moderate_social_content_secure(p_target_type, p_target_id, p_action, p_reason);
$wrapper$;

REVOKE ALL ON FUNCTION public.qnr_admin_moderate_social_content(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.qnr_admin_moderate_social_content(text, uuid, text, text) TO authenticated;
