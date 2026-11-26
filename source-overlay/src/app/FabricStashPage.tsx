import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Archive, Check, Edit3, PackagePlus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './fabric-stash.css'

type Fabric = {
  id: string; user_id: string; name: string; fabric_type: string; color_name: string
  color_hex: string; pattern: string; quantity: number; unit: 'meter'|'yard'|'piece'|'fat_quarter'
  width_cm: number|null; location: string; notes: string; updated_at: string
}
type Draft = Omit<Fabric,'id'|'user_id'|'updated_at'>
const blank: Draft = {name:'',fabric_type:'cotton',color_name:'',color_hex:'#648b78',pattern:'',quantity:1,unit:'meter',width_cm:null,location:'',notes:''}
const typeLabels: Record<string,string> = {cotton:'نخی',linen:'کتان',silk:'ابریشم',wool:'پشمی',blend:'ترکیبی',other:'سایر'}
const unitLabels: Record<string,string> = {meter:'متر',yard:'یارد',piece:'تکه',fat_quarter:'ربع‌پارچه'}
const errorText = (message:string) => {
  if (message.includes('permission denied') || message.includes('row-level security')) return 'اجازهٔ دسترسی به انبار پارچه صادر نشد. دوباره وارد حساب شو.'
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) return 'ارتباط شبکه قطع شده است؛ اتصال اینترنت را بررسی کن.'
  return 'ذخیره‌سازی اطلاعات انجام نشد. دوباره تلاش کن.'
}

export function FabricStashPage() {
  const [user,setUser] = useState<string|null>(null)
  const [items,setItems] = useState<Fabric[]>([])
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [search,setSearch] = useState('')
  const [filter,setFilter] = useState('all')
  const [editing,setEditing] = useState<string|null>(null)
  const [draft,setDraft] = useState<Draft>(blank)
  const [formOpen,setFormOpen] = useState(false)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user.id ?? null))
    const {data} = supabase.auth.onAuthStateChange((_event,session) => setUser(session?.user.id ?? null))
    return () => data.subscription.unsubscribe()
  },[])

  const load = useCallback(async () => {
    if (!supabase || !user) { setItems([]); setLoading(false); return }
    setLoading(true); setError('')
    const {data,error:queryError} = await supabase.from('qnr_fabric_stash').select('*').eq('user_id',user).order('updated_at',{ascending:false})
    if (queryError) setError(errorText(queryError.message))
    else setItems((data ?? []) as Fabric[])
    setLoading(false)
  },[user])
  useEffect(() => { void load() },[load])

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fa')
    return items.filter(item => (filter === 'all' || item.fabric_type === filter) && (!term || [item.name,item.color_name,item.pattern,item.location,item.notes].join(' ').toLocaleLowerCase('fa').includes(term)))
  },[items,search,filter])
  const lowStock = items.filter(item => item.quantity <= 1).length

  function startNew() { setEditing(null); setDraft(blank); setError(''); setNotice(''); setFormOpen(true) }
  function startEdit(item:Fabric) {
    setEditing(item.id)
    setDraft({name:item.name,fabric_type:item.fabric_type,color_name:item.color_name,color_hex:item.color_hex,pattern:item.pattern,quantity:Number(item.quantity),unit:item.unit,width_cm:item.width_cm,location:item.location,notes:item.notes})
    setError(''); setNotice(''); setFormOpen(true)
  }
  function closeForm() { setFormOpen(false); setEditing(null); setDraft(blank) }
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !user || saving) return
    if (!draft.name.trim()) { setError('نام پارچه را وارد کن.'); return }
    if (!Number.isFinite(Number(draft.quantity)) || Number(draft.quantity) < 0) { setError('مقدار موجودی معتبر نیست.'); return }
    setSaving(true); setError(''); setNotice('')
    const payload = {...draft,name:draft.name.trim(),quantity:Number(draft.quantity),width_cm:draft.width_cm === null || draft.width_cm === 0 ? null : Number(draft.width_cm),updated_at:new Date().toISOString()}
    const result = editing
      ? await supabase.from('qnr_fabric_stash').update(payload).eq('id',editing).eq('user_id',user)
      : await supabase.from('qnr_fabric_stash').insert({...payload,user_id:user})
    setSaving(false)
    if (result.error) { setError(errorText(result.error.message)); return }
    setNotice(editing ? 'مشخصات پارچه به‌روزرسانی شد.' : 'پارچه به انبارت اضافه شد.')
    closeForm()
    await load()
  }
  async function remove(item:Fabric) {
    if (!supabase || !user || !window.confirm('این پارچه از انبار شخصی حذف شود؟')) return
    setError(''); setNotice('')
    const {error:deleteError} = await supabase.from('qnr_fabric_stash').delete().eq('id',item.id).eq('user_id',user)
    if (deleteError) { setError(errorText(deleteError.message)); return }
    setItems(current => current.filter(row => row.id !== item.id))
    setNotice('پارچه از انبار حذف شد.')
  }

  if (!supabase) return <main className="nn-stash-page"><section className="nn-stash-empty"><Archive size={32}/><h1>انبار پارچه</h1><p>اتصال امن سرویس در دسترس نیست. تنظیمات اتصال پروژه را بررسی کن.</p></section></main>
  if (!user) return <main className="nn-stash-page"><section className="nn-stash-empty"><Archive size={32}/><h1>انبار پارچهٔ شخصی</h1><p>برای ثبت و مدیریت پارچه‌ها ابتدا وارد حساب کاربری شو.</p><a href="/account">ورود به حساب</a></section></main>

  return <main className="nn-stash-page">
    <header className="nn-stash-hero">
      <div className="nn-stash-hero-copy"><span className="nn-stash-eyebrow">کارگاه شخصی تو</span><h1>انبار پارچه</h1><p>پارچه‌هایت را ثبت کن، رنگ‌ها را کنار هم ببین و قبل از خرید بعدی، موجودی واقعی‌ات را بررسی کن.</p></div>
      <div className="nn-stash-hero-mark"><Archive size={38}/><span>STASH<br/>BOOK</span></div>
    </header>
    <section className="nn-stash-stats" aria-label="خلاصه انبار">
      <article><span>کل پارچه‌ها</span><strong>{items.length.toLocaleString('fa-IR')}</strong><small>رکورد ثبت‌شده</small></article>
      <article><span>نیازمند شارژ</span><strong>{lowStock.toLocaleString('fa-IR')}</strong><small>موجودی یک واحد یا کمتر</small></article>
      <article><span>انواع پارچه</span><strong>{new Set(items.map(item=>item.fabric_type)).size.toLocaleString('fa-IR')}</strong><small>جنس‌های متفاوت</small></article>
    </section>
    <section className="nn-stash-toolbar">
      <label className="nn-stash-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجو در نام، رنگ، طرح یا محل نگهداری" /></label>
      <select aria-label="فیلتر جنس پارچه" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">همهٔ جنس‌ها</option>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <button className="nn-stash-add" type="button" onClick={startNew}><PackagePlus size={18}/> افزودن پارچه</button>
    </section>
    {error && <p className="nn-stash-message nn-stash-error" role="alert">{error}</p>}
    {notice && <p className="nn-stash-message nn-stash-success" role="status">{notice}</p>}
    {formOpen && <div className="nn-stash-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm()}}>
      <form className="nn-stash-form" onSubmit={save}>
        <div className="nn-stash-form-head"><div><span className="nn-stash-eyebrow">{editing?'ویرایش موجودی':'ثبت موجودی تازه'}</span><h2>{editing?'ویرایش پارچه':'پارچهٔ جدید'}</h2></div><button type="button" className="nn-stash-icon-button" onClick={closeForm} aria-label="بستن"><X size={20}/></button></div>
        <div className="nn-stash-form-grid">
          <label>نام پارچه<input required maxLength={100} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="مثلاً گل‌ریز کرم" /></label>
          <label>جنس<select value={draft.fabric_type} onChange={e=>setDraft({...draft,fabric_type:e.target.value})}>{Object.entries(typeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>نام رنگ<input value={draft.color_name} maxLength={50} onChange={e=>setDraft({...draft,color_name:e.target.value})} placeholder="مثلاً سبز زیتونی" /></label>
          <label>نمونه رنگ<input className="nn-stash-color" type="color" value={draft.color_hex} onChange={e=>setDraft({...draft,color_hex:e.target.value})} /></label>
          <label>طرح یا نقش<input value={draft.pattern} maxLength={80} onChange={e=>setDraft({...draft,pattern:e.target.value})} placeholder="ساده، گل‌دار، هندسی..." /></label>
          <label>مقدار موجودی<input type="number" min="0" max="100000" step="0.01" value={draft.quantity} onChange={e=>setDraft({...draft,quantity:Number(e.target.value)})} /></label>
          <label>واحد<select value={draft.unit} onChange={e=>setDraft({...draft,unit:e.target.value as Draft['unit']})}>{Object.entries(unitLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label>عرض پارچه (سانتی‌متر)<input type="number" min="0" max="10000" step="0.1" value={draft.width_cm ?? ''} onChange={e=>setDraft({...draft,width_cm:e.target.value===''?null:Number(e.target.value)})} placeholder="اختیاری" /></label>
          <label>محل نگهداری<input value={draft.location} maxLength={100} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="مثلاً کشوی دوم" /></label>
          <label className="nn-stash-notes">یادداشت<textarea rows={3} maxLength={1000} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="کد رنگ، فروشگاه، مناسب چه پروژه‌ای..." /></label>
        </div>
        {error && <p className="nn-stash-message nn-stash-error" role="alert">{error}</p>}
        <div className="nn-stash-form-actions"><button type="button" className="nn-stash-cancel" onClick={closeForm}>انصراف</button><button className="nn-stash-add" type="submit" disabled={saving}>{saving?'در حال ذخیره…':<><Check size={17}/> ذخیرهٔ پارچه</>}</button></div>
      </form>
    </div>}
    {loading ? <div className="nn-stash-loading">در حال بارگذاری انبار…</div> : visible.length ? <section className="nn-stash-grid" aria-label="پارچه‌های ثبت‌شده">
      {visible.map(item=><article className="nn-stash-card" key={item.id}>
        <div className="nn-stash-swatch" style={{background:item.color_hex}}><span>{item.color_name||'نمونه رنگ'}</span></div>
        <div className="nn-stash-card-body">
          <div className="nn-stash-card-title"><div><h2>{item.name}</h2><span>{typeLabels[item.fabric_type]??'سایر'}{item.pattern ? ' · ' + item.pattern : ''}</span></div><div className="nn-stash-actions"><button type="button" onClick={()=>startEdit(item)} aria-label="ویرایش"><Edit3 size={16}/></button><button type="button" onClick={()=>void remove(item)} aria-label="حذف"><Trash2 size={16}/></button></div></div>
          <div className="nn-stash-quantity"><strong>{Number(item.quantity).toLocaleString('fa-IR',{maximumFractionDigits:2})}</strong><span>{unitLabels[item.unit]??item.unit}</span>{item.quantity<=1&&<em>رو به اتمام</em>}</div>
          <div className="nn-stash-meta">{item.width_cm?'عرض '+Number(item.width_cm).toLocaleString('fa-IR')+' سانتی‌متر':'عرض ثبت نشده'}{item.location?' · '+item.location:''}</div>
          {item.notes&&<p className="nn-stash-notes-text">{item.notes}</p>}
        </div>
      </article>)}
    </section> : <section className="nn-stash-empty"><Archive size={34}/><h2>{items.length?'موردی پیدا نشد':'انبارت هنوز خالی است'}</h2><p>{items.length?'عبارت جست‌وجو یا فیلتر را تغییر بده.':'اولین پارچه را ثبت کن تا موجودی کارگاهت همیشه در دسترس باشد.'}</p>{!items.length&&<button type="button" className="nn-stash-add" onClick={startNew}><PackagePlus size={18}/> ثبت اولین پارچه</button>}</section>}
  </main>
}
