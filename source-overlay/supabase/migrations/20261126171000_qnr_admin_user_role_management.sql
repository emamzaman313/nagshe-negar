-- Audited administrator role management. Existing admin grants are intentionally immutable from this RPC.
create or replace function public.qnr_admin_set_user_role(p_user_id uuid,p_role text,p_grant boolean)
returns void language plpgsql security definer set search_path=public,qnr_private,pg_temp as $$
begin
 if auth.uid() is null or not qnr_private.qnr_is_admin() then
  raise exception 'admin_required' using errcode='42501';
 end if;
 if p_user_id is null or p_role not in ('editor','teacher','moderator','seller') then
  raise exception 'invalid_role_request' using errcode='22023';
 end if;
 if p_grant then
  insert into public.qnr_user_roles(user_id,role,granted_by)
  values(p_user_id,p_role,auth.uid()) on conflict(user_id,role) do nothing;
 else
  delete from public.qnr_user_roles where user_id=p_user_id and role=p_role;
 end if;
 insert into public.qnr_audit_log(actor_id,action,subject_type,subject_id,reason,details)
 values(auth.uid(),case when p_grant then 'grant_role' else 'revoke_role' end,'user_role',p_user_id::text,null,
 jsonb_build_object('role',p_role));
end;
$$;
revoke all on function public.qnr_admin_set_user_role(uuid,text,boolean) from public,anon;
grant execute on function public.qnr_admin_set_user_role(uuid,text,boolean) to authenticated;
