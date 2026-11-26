type RouteMetadata = { title: string; description: string; private?: boolean }

const brand = "نقش‌نگار"
const defaultDescription = "نقش‌نگار؛ فضایی برای طراحی الگوهای چهل‌تکه، یادگیری، نمایش آثار و ارتباط با هنرمندان این هنر."

const routes: Record<string, RouteMetadata> = {
  "/": { title: "نقش‌نگار | طراحی و آموزش چهل‌تکه‌دوزی", description: defaultDescription },
  "/designer": { title: "طراح بلوک چهل‌تکه | نقش‌نگار", description: "با طراح بلوک نقش‌نگار الگوهای چهل‌تکه‌دوزی بساز، رنگ‌ها و قطعه‌ها را کنار هم بچین و ایده‌هایت را به پروژه تبدیل کن." },
  "/gallery": { title: "گالری آثار چهل‌تکه‌دوزی | نقش‌نگار", description: "نمونه‌کارها و ایده‌های هنرمندان چهل‌تکه‌دوزی را در گالری نقش‌نگار ببین و از طرح‌های دست‌ساز الهام بگیر." },
  "/courses": { title: "دوره‌های آموزش چهل‌تکه‌دوزی | نقش‌نگار", description: "مسیر یادگیری چهل‌تکه‌دوزی را با آموزش‌ها و دوره‌های نقش‌نگار دنبال کن." },
  "/shop": { title: "فروشگاه هنر و لوازم چهل‌تکه‌دوزی | نقش‌نگار", description: "محصولات و لوازم موردنیاز هنر چهل‌تکه‌دوزی را در فروشگاه نقش‌نگار پیدا کن." },
  "/social": { title: "جامعه هنرمندان چهل‌تکه‌دوزی | نقش‌نگار", description: "آثار، تجربه‌ها و ایده‌های هنرمندان چهل‌تکه‌دوزی را ببین و با جامعه نقش‌نگار همراه شو." },
  "/reels": { title: "ویدئوهای کوتاه چهل‌تکه‌دوزی | نقش‌نگار", description: "ویدئوهای کوتاه، تکنیک‌ها و لحظه‌های خلاقانه دنیای چهل‌تکه‌دوزی را تماشا کن." },
  "/music": { title: "استودیوی موسیقی نقش‌نگار | کتابخانه شنیداری", description: "کتابخانه موسیقی دارای مجوز، پلی‌لیست‌های شخصی و موسیقی امضای پروفایل در نقش‌نگار." },
  "/guide": { title: "راهنمای چهل‌تکه‌دوزی | نقش‌نگار", description: "راهنمای الگوها، ابزارها، روش‌های برش و نکته‌های کاربردی برای یادگیری چهل‌تکه‌دوزی." },
  "/learn": { title: "مسیر یادگیری چهل‌تکه‌دوزی | نقش‌نگار", description: "از تمرین‌های مقدماتی تا شناخت بلوک‌ها و تکنیک‌های چهل‌تکه‌دوزی، مسیر یادگیری خود را دنبال کن." },
  "/shop/parche": { title: "پارچه و متریال چهل‌تکه‌دوزی | فروشگاه نقش‌نگار", description: "پارچه‌ها و متریال مناسب پروژه‌های چهل‌تکه‌دوزی را بررسی کن و جنس و رنگ موردنیاز طرحت را انتخاب کن." },
  "/support": { title: "پشتیبانی نقش‌نگار | راهنمای کاربران", description: "برای راهنمایی استفاده از نقش‌نگار، پیگیری درخواست‌ها و دریافت پاسخ پرسش‌های خود با پشتیبانی همراه شو." },
  "/privacy": { title: "حریم خصوصی | نقش‌نگار", description: "در سیاست حریم خصوصی نقش‌نگار با شیوهٔ نگهداری، استفاده و حفاظت از اطلاعات کاربران آشنا شو." },
  "/account": { title: "حساب کاربری | نقش‌نگار", description: "ورود به حساب شخصی، مدیریت اطلاعات پروفایل و تنظیم تنظیمات کاربری در فضای نقش‌نگار.", private: true },
  "/cart": { title: "سبد خرید | نقش‌نگار", description: "مرور اقلام انتخاب‌شده، بررسی جزئیات سفارش و ادامهٔ فرایند خرید در فروشگاه نقش‌نگار.", private: true },
  "/notifications": { title: "اعلان‌های شخصی | نقش‌نگار", description: "مشاهدهٔ اعلان‌های تازه، پیام‌های سیستمی و به‌روزرسانی‌های مرتبط با حساب شما در نقش‌نگار.", private: true },
  "/stash": { title: "انبار پارچه شخصی | نقش‌نگار", description: "مدیریت موجودی پارچه‌های کارگاه شخصی.", private: true },
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function addStudioNavLink() {
  const nav = document.querySelector<HTMLElement>("#root nav")
  if (!nav) return
  const sample = nav.querySelector<HTMLAnchorElement>("a[href]")
  const addLink = (href: string, label: string, marker: string, ariaLabel: string) => {
    if (nav.querySelector(`[${marker}]`)) return
    const link = document.createElement("a")
    link.href = href
    link.textContent = label
    link.setAttribute(marker, "true")
    link.setAttribute("aria-label", ariaLabel)
    if (sample) link.className = sample.className
    nav.appendChild(link)
  }
  addLink("/quilt-studio-preview.html", "استودیوی لحاف", "data-nn-studio-link", "استودیوی طراحی لحاف نقش‌نگار")
  addLink("/reels", "ریلز", "data-nn-reels-link", "ویدئوهای کوتاه چهل‌تکه‌دوزی")
}

function applyRouteMetadata() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  const meta = routes[path] ?? { title: brand, description: defaultDescription }
  document.title = meta.title
  setMeta("name", "description", meta.description)
  setMeta("property", "og:title", meta.title)
  setMeta("property", "og:description", meta.description)
  setMeta("name", "robots", meta.private ? "noindex,nofollow" : "index,follow")
  addStudioNavLink()
}
let lastPath = ""
const tick = () => {
  if (lastPath !== window.location.pathname) {
    lastPath = window.location.pathname
    applyRouteMetadata()
  }
}
const observer = new MutationObserver(tick)
observer.observe(document.documentElement,{childList:true,subtree:true})
window.addEventListener("popstate",tick)
window.addEventListener("hashchange",tick)
tick()
