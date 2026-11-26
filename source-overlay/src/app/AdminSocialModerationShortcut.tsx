import { useEffect, useState } from 'react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './social-moderation-admin.css'

export function AdminSocialModerationShortcut(){
 const [visible,setVisible]=useState(false)
 useEffect(()=>{
  let active=true
  if(!supabase)return
  supabase.auth.getSession().then(async({data})=>{
   const userId=data.session?.user.id
   if(!userId)return
   const {data:role,error}=await supabase!.from('qnr_user_roles').select('role').eq('user_id',userId).eq('role','admin').maybeSingle()
   if(active&&!error&&role)setVisible(true)
  })
  return()=>{active=false}
 },[])
 if(!visible)return null
 return <section className="nn-admin-mod-shortcut" aria-label="مدیریت جامعه و ریلز">
  <div className="nn-admin-mod-shortcut__icon"><ShieldCheck size={22}/></div>
  <div><strong>مدیریت جامعه و ریلز</strong><p>صف تأیید ریلز و پست‌ها، گزارش‌های کاربران و مدیریت دیدگاه‌ها</p></div>
  <a href="/admin/social-moderation">ورود به مرکز بررسی <ArrowUpRight size={17}/></a>
 </section>
}
