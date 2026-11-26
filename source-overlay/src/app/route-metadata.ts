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

function syncSemanticHeadings() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  const root = document.querySelector<HTMLElement>("#root main, #root [role='main']") ?? document.getElementById("root")
  if (!root) return

  if (path === "/reels") {
    const synthetic = root.querySelector<HTMLElement>('h1[data-nn-route-heading="true"]')
    const realHeadings = Array.from(root.querySelectorAll("h1")).filter((heading) => !heading.hasAttribute("data-nn-route-heading"))
    if (realHeadings.length > 0) {
      synthetic?.remove()
    } else if (!synthetic) {
      const heading = document.createElement("h1")
      heading.dataset.nnRouteHeading = "true"
      heading.textContent = "ویدئوهای کوتاه چهل‌تکه‌دوزی"
      heading.style.cssText = "margin:0 0 1rem;font-size:clamp(1.25rem,2vw,1.75rem);font-weight:700;line-height:1.4"
      root.prepend(heading)
    }
  }

  if (path === "/shop/parche") {
    const headings = Array.from(root.querySelectorAll<HTMLElement>("h1"))
    headings.slice(1).forEach((original) => {
      const replacement = document.createElement("h2")
      replacement.className = original.className
      replacement.innerHTML = original.innerHTML
      for (const name of original.getAttributeNames()) {
        if (name !== "class" && name !== "id") replacement.setAttribute(name, original.getAttribute(name) ?? "")
      }
      const computed = window.getComputedStyle(original)
      for (const property of ["font-size", "font-weight", "line-height", "letter-spacing", "color", "margin", "text-align"]) {
        replacement.style.setProperty(property, computed.getPropertyValue(property))
      }
      original.replaceWith(replacement)
    })
  }
}

function syncRouteMetadata() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  const route = routes[path]
  const isPrivate = Boolean(route?.private || path === "/admin" || path.startsWith("/admin/"))
  const heading = document.querySelector<HTMLElement>("#root h1")?.textContent?.trim()
  const title = route?.title ?? (heading ? `${heading} | ${brand}` : `${brand} | طراحی و آموزش چهل‌تکه‌دوزی`)
  const description = route?.description ?? defaultDescription

  document.title = title
  setMeta("name", "description", description)
  setMeta("name", "robots", isPrivate ? "noindex,nofollow" : "index,follow")
  setMeta("property", "og:type", "website")
  setMeta("property", "og:locale", "fa_IR")
  setMeta("property", "og:site_name", brand)
  setMeta("property", "og:title", title)
  setMeta("property", "og:description", description)
  setMeta("name", "twitter:card", "summary_large_image")
  setMeta("name", "twitter:title", title)
  setMeta("name", "twitter:description", description)

  const existingCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (isPrivate) {
    existingCanonical?.remove()
    return
  }

  const canonical = existingCanonical ?? document.createElement("link")
  canonical.rel = "canonical"
  canonical.href = new URL(path, window.location.origin).toString()
  if (!existingCanonical) document.head.appendChild(canonical)
  setMeta("property", "og:url", canonical.href)
}

const originalPushState = window.history.pushState.bind(window.history)
window.history.pushState = ((
  data: Parameters<History["pushState"]>[0],
  unused: Parameters<History["pushState"]>[1],
  url?: Parameters<History["pushState"]>[2],
) => {
  originalPushState(data, unused, url)
  queueMicrotask(syncRouteMetadata)
}) as History["pushState"]

const originalReplaceState = window.history.replaceState.bind(window.history)
window.history.replaceState = ((
  data: Parameters<History["replaceState"]>[0],
  unused: Parameters<History["replaceState"]>[1],
  url?: Parameters<History["replaceState"]>[2],
) => {
  originalReplaceState(data, unused, url)
  queueMicrotask(syncRouteMetadata)
}) as History["replaceState"]

window.addEventListener("popstate", syncRouteMetadata)
const appRoot = document.getElementById("root") ?? document.documentElement
const observer = new MutationObserver(() => queueMicrotask(() => { syncRouteMetadata(); syncSemanticHeadings(); addStudioNavLink(); addEditorialContent() }))
observer.observe(appRoot, { childList: true, subtree: true })
syncRouteMetadata()
addEditorialContent()


/* Visible, route-specific editorial guidance. Kept separate from transactional UI and
   inserted once after each public route renders, so crawlers and screen readers can read it. */
const editorialContent: Record<string, { title: string; intro: string; sections: Array<[string, string]> }> = {
  "/": {
    title: "از ایده تا دوخت؛ کارگاه خلاقیت چهل‌تکه",
    intro: "چهل‌تکه‌دوزی هنری برای تبدیل تکه‌های کوچک پارچه به ترکیبی تازه و ماندگار است. در نقش‌نگار می‌توانی مسیر خلق یک اثر را از انتخاب رنگ و ساخت بلوک تا نمایش نتیجه دنبال کنی.",
    sections: [
      ["طراحی الگو پیش از برش", "پیش از بریدن پارچه، طرح را روی شبکه‌ای ساده تصور کن. تعداد قطعه‌ها، اندازهٔ نهایی و جهت قرارگیری نقش‌ها را مشخص کن تا هنگام دوخت با اختلاف اندازه و هدررفت پارچه روبه‌رو نشوی."],
      ["رنگ و جنس پارچه را هماهنگ کن", "برای شروع، یک رنگ پایه و دو یا سه رنگ همراه انتخاب کن. ترکیب پارچه‌های روشن و تیره به مرزبندی قطعه‌ها کمک می‌کند؛ بهتر است پارچه‌هایی با وزن و کشسانی نزدیک را کنار هم بدوزی."],
      ["یادگیری و الهام از جامعه", "از آموزش‌های مقدماتی شروع کن، نمونه‌کارهای گالری را ببین و تجربه‌هایت را با دیگر هنرمندان به اشتراک بگذار. هر پروژه می‌تواند فرصتی برای تمرین دقت، ترکیب رنگ و شناخت هندسهٔ بلوک‌ها باشد."]
    ]
  },
  "/courses": {
    title: "چطور مسیر یادگیری چهل‌تکه‌دوزی را انتخاب کنیم؟",
    intro: "یک دورهٔ خوب باید مهارت را مرحله‌به‌مرحله آموزش دهد و در پایان هر بخش تمرینی قابل‌اندازه‌گیری داشته باشد. پیش از انتخاب، سطح فعلی، ابزار در دسترس و زمانی را که برای تمرین کنار می‌گذاری مشخص کن.",
    sections: [
      ["سطح مقدماتی", "در شروع، شناخت ابزار برش، خط‌کش، تختهٔ برش، جای‌درز و دوخت مستقیم اهمیت دارد. تمرین مربع‌های هم‌اندازه کمک می‌کند کنترل فاصلهٔ دوخت و دقت اندازه‌گیری را به دست بیاوری."],
      ["سطح میانی", "پس از تسلط بر قطعه‌های ساده، سراغ مثلث‌ها، نیم‌مربع‌ها، نوارها و بلوک‌های ستاره‌ای برو. در این مرحله اتوکشی درست و ثابت نگه‌داشتن جای‌درز، کیفیت اتصال‌ها را بهتر می‌کند."],
      ["تمرین پروژه‌محور", "به‌جای جمع‌کردن آموزش‌های پراکنده، یک پروژهٔ کوچک مانند کوسن یا رانر انتخاب کن. الگو را ثبت کن، مقدار پارچه را برآورد کن و پس از هر مرحله اندازه‌ها را با طرح اولیه مقایسه کن."]
    ]
  },
  "/designer": {
    title: "راهنمای طراحی بلوک چهل‌تکه",
    intro: "طراحی یک بلوک از هندسه شروع می‌شود: ابتدا اندازهٔ مربع پایه و تعداد تقسیمات را تعیین کن، سپس شکل‌های ساده را درون شبکه کنار هم قرار بده. یک طرح خوانا معمولاً از تعداد محدودی قطعه و تضاد رنگی سنجیده استفاده می‌کند.",
    sections: [
      ["شبکه و اندازهٔ نهایی", "اندازهٔ نهایی بلوک را پیش از افزودن جای‌درز مشخص کن. همهٔ قطعه‌ها باید با ابعاد برش سازگار باشند؛ برای قطعه‌های زاویه‌دار، مقدار اضافهٔ لازم برای جای‌درز را در محاسبه لحاظ کن."],
      ["تعادل رنگ و کنتراست", "سه سطح روشنایی در طرح ایجاد کن: روشن، میانه و تیره. حتی اگر رنگ‌ها به هم نزدیک باشند، تفاوت روشنایی باعث می‌شود فرم ستاره، لوزی یا نوارها از فاصله قابل تشخیص بماند."],
      ["آزمایش پیش از دوخت", "پیش از برش پارچهٔ اصلی، طرح را با کاغذ یا تکه‌های آزمایشی بررسی کن. چرخاندن یک بلوک یا جابه‌جایی دو رنگ می‌تواند ریتم بصری را تغییر دهد؛ نسخه‌های مختلف را ذخیره و مقایسه کن."]
    ]
  },
  "/gallery": {
    title: "چطور از گالری آثار الهام بگیریم؟",
    intro: "گالری زمانی مفید است که فقط به تماشای نتیجه محدود نشود؛ به ترکیب رنگ، اندازهٔ بلوک‌ها، تکرار نقش و شیوهٔ قاب‌بندی هر اثر دقت کن. از هر نمونه یک ایده بردار و آن را با سلیقهٔ خودت بازطراحی کن.",
    sections: [
      ["ترکیب‌بندی را تحلیل کن", "ببین چشم ابتدا به کدام بخش اثر جذب می‌شود. یک مرکز پرکنتراست، حاشیهٔ ساده یا تکرار منظم بلوک‌ها می‌تواند مسیر نگاه را هدایت کند."],
      ["جزئیات دوخت را بررسی کن", "در عکس‌های نزدیک، به هم‌راستایی درزها، تخت‌بودن سطح و هماهنگی قطعه‌ها توجه کن. این جزئیات اغلب بیش از پیچیدگی الگو بر کیفیت نهایی اثر می‌گذارند."],
      ["اثر خودت را مستند کن", "از مراحل انتخاب پارچه، چیدمان اولیه و دوخت عکس بگیر. ثبت روند ساخت، پیشرفت را قابل‌مشاهده می‌کند و هنگام انتشار اثر، داستان و تصمیم‌های پشت آن را بهتر منتقل می‌کند."]
    ]
  },
  "/shop": {
    title: "راهنمای انتخاب ابزار و لوازم چهل‌تکه‌دوزی",
    intro: "خرید ابزار مناسب باید بر اساس نوع پروژه و میزان استفاده انجام شود. برای شروع لازم نیست همهٔ وسایل حرفه‌ای را تهیه کنی؛ چند ابزار دقیق و ایمن، کارهای پایه را پوشش می‌دهند.",
    sections: [
      ["ابزارهای پایه", "کاتر گرد، تختهٔ برش، خط‌کش مخصوص، سوزن مناسب و اتوی قابل‌کنترل از ابزارهای پرکاربرد هستند. تیغهٔ تیز برش تمیزتری می‌دهد، اما هنگام استفاده باید دست آزاد را بیرون از مسیر تیغه نگه داری."],
      ["پارچهٔ مناسب پروژه", "پارچه‌های بافته‌شده و کم‌کشش معمولاً برای قطعه‌دوزی قابل‌کنترل‌ترند. پیش از برش، دستور شست‌وشوی پارچه را بررسی کن و در صورت نیاز آن را آب‌کشی و اتو کن تا تغییر اندازهٔ بعدی کمتر شود."],
      ["برآورد مقدار موردنیاز", "الگو، اندازهٔ نهایی، عرض پارچه و مقدار جای‌درز بر مصرف اثر دارند. کمی پارچهٔ اضافه برای خطای برش و هماهنگ‌کردن نقش‌ها در نظر بگیر؛ اما مقدار خرید را بر پایهٔ فهرست قطعه‌ها محاسبه کن."]
    ]
  },
  "/social": {
    title: "جامعه‌ای برای یادگیری و به‌اشتراک‌گذاری تجربه",
    intro: "جامعهٔ هنرمندان زمانی ارزشمند می‌شود که اعضا بتوانند پرسش بپرسند، روند ساخت را نشان دهند و بازخورد محترمانه دریافت کنند. توضیح کوتاه دربارهٔ جنس پارچه، روش اجرا و چالش پروژه، گفت‌وگو را کاربردی‌تر می‌کند.",
    sections: [
      ["انتشار یک پست مفید", "برای معرفی اثر، یک تصویر روشن و توضیحی دقیق انتخاب کن. نام تکنیک، اندازهٔ تقریبی و نکته‌ای که هنگام دوخت یاد گرفته‌ای به دیگران کمک می‌کند از تجربه‌ات استفاده کنند."],
      ["بازخورد سازنده", "به‌جای قضاوت کلی، دربارهٔ یک ویژگی مشخص نظر بده؛ مثلاً هماهنگی رنگ‌ها یا تمیزی اتصال‌ها. اگر پرسشی داری، آن را روشن و همراه با عکس جزئیات مطرح کن."],
      ["حفظ احترام و امنیت", "اطلاعات شخصی دیگران را بدون اجازه منتشر نکن و در صورت مشاهدهٔ محتوای نامناسب از ابزار گزارش استفاده کن. اعتبار جامعه با رعایت حقوق خالق اثر و گفت‌وگوی محترمانه حفظ می‌شود."]
    ]
  },
  "/reels": {
    title: "ایده‌هایی برای ویدئوهای کوتاه چهل‌تکه‌دوزی",
    intro: "ویدئوی کوتاه می‌تواند یک مرحلهٔ کوچک از فرایند ساخت را روشن کند؛ از برش دقیق تا چیدمان نهایی بلوک. برای آموزش بهتر، قاب ثابت، نور کافی و نمایش نزدیک دست‌ها از جلوه‌های شلوغ مهم‌تر است.",
    sections: [
      ["یک نکته در هر ویدئو", "موضوع را محدود کن: تنظیم جای‌درز، دوخت گوشه‌ها یا چیدمان رنگ. نمایش یک مهارت مشخص باعث می‌شود مخاطب بتواند آن را به خاطر بسپارد و تکرار کند."],
      ["قبل و بعد را نشان بده", "نمایش قطعه‌های جدا در کنار بلوک کامل، رابطهٔ مراحل را روشن می‌کند. اگر از موسیقی یا تصویر دیگران استفاده می‌کنی، حقوق صاحب اثر را رعایت کن."],
      ["توضیح و دسترس‌پذیری", "برای ویدئو عنوان و توضیح دقیق بنویس و نکتهٔ اصلی را فقط به صدا وابسته نکن. زیرنویس کوتاه و تصویر واضح، فهم محتوا را برای افراد بیشتری آسان می‌کند."]
    ]
  },
  "/guide": {
    title: "راهنمای ابزار، برش و دوخت",
    intro: "کیفیت چهل‌تکه‌دوزی از اندازه‌گیری دقیق و تکرارپذیری مراحل به دست می‌آید. پیش از شروع، سطح کار را مرتب کن، ابزار برش را بررسی کن و الگو را با اندازه‌های واقعی پارچه تطبیق بده.",
    sections: [
      ["اندازه‌گیری و جای‌درز", "همیشه از یک واحد اندازه‌گیری ثابت استفاده کن. جای‌درز را در تمام قطعه‌های یک پروژه یکسان نگه دار و پس از دوخت چند قطعهٔ نخست، اندازهٔ مجموعه را دوباره کنترل کن."],
      ["برش ایمن و دقیق", "پارچه را بدون کشیدن روی تختهٔ برش صاف کن. خط‌کش را محکم نگه دار و کاتر را در امتداد لبه حرکت بده؛ تیغه را پس از استفاده ببند و دور از دسترس کودکان قرار بده."],
      ["دوخت و اتوکشی", "قطعه‌ها را پیش از دوخت با سنجاق یا گیره ثابت کن. پس از هر اتصال، درز را با اتوی کنترل‌شده بخوابان و از کشیدن پارچه خودداری کن تا بلوک تاب برندارد."]
    ]
  },
  "/learn": {
    title: "برنامهٔ تمرین مرحله‌به‌مرحله",
    intro: "یادگیری پایدار با تمرین کوتاه و منظم شکل می‌گیرد. هر جلسه یک هدف روشن داشته باشد و نتیجه را ثبت کن؛ این کار کمک می‌کند خطاهای اندازه‌گیری یا دوخت را زودتر پیدا کنی.",
    sections: [
      ["تمرین اول: برش مربع", "چند مربع هم‌اندازه از پارچهٔ آزمایشی ببر و لبه‌ها را اندازه بگیر. اختلاف‌ها را یادداشت کن و علت آن را در قرارگیری خط‌کش یا فشار کاتر جست‌وجو کن."],
      ["تمرین دوم: اتصال دو قطعه", "دو مربع را با جای‌درز یکسان به هم بدوز. پس از اتو، طول و عرض را بررسی کن و مطمئن شو لبه‌ها بدون کشیدگی روی هم قرار گرفته‌اند."],
      ["تمرین سوم: ساخت بلوک کوچک", "با چهار یا نه قطعه یک بلوک ساده بساز. پیش از دوخت نهایی چند چیدمان رنگی را امتحان کن و از نسخهٔ منتخب عکس بگیر تا بتوانی نتیجه را مقایسه کنی."]
    ]
  },
  "/shop/parche": {
    title: "انتخاب پارچه برای پروژهٔ چهل‌تکه",
    intro: "پارچهٔ مناسب باید با کاربرد نهایی، روش شست‌وشو و میزان استفاده هماهنگ باشد. برای قطعه‌دوزی دقیق، پارچه‌ای با بافت پایدار و کشسانی کم معمولاً کنترل بیشتری هنگام برش و دوخت فراهم می‌کند.",
    sections: [
      ["هماهنگی جنس‌ها", "پارچه‌هایی با ضخامت نزدیک را در یک بلوک ترکیب کن. تفاوت زیاد در ضخامت یا لغزندگی می‌تواند باعث جابه‌جایی لبه‌ها و ناهمواری در محل اتصال شود."],
      ["ثبات رنگ و آماده‌سازی", "پیش از ترکیب پارچه‌های رنگی، ثبات رنگ را در گوشه‌ای کوچک آزمایش کن. آماده‌سازی و اتوکشی مطابق دستور مراقبت پارچه، احتمال تغییر اندازه پس از دوخت را کمتر می‌کند."],
      ["انتخاب پالت", "یک رنگ غالب، یک رنگ مکمل و یک رنگ خنثی نقطهٔ شروع ساده‌ای هستند. نمونه‌ها را کنار هم و زیر نور مشابه بررسی کن؛ رنگ پارچه در نورهای متفاوت ممکن است تغییر کند."]
    ]
  },
  "/support": {
    title: "راهنمای دریافت پشتیبانی",
    intro: "برای اینکه درخواست پشتیبانی سریع‌تر بررسی شود، نام بخشی که در آن مشکل رخ داده و کاری را که پیش از خطا انجام داده‌ای توضیح بده. اگر پیام خطا می‌بینی، متن دقیق آن را بدون اطلاعات حساس ارسال کن.",
    sections: [
      ["گزارش مشکل فنی", "مدل دستگاه، سیستم‌عامل، مرورگر و زمان تقریبی بروز مشکل را ذکر کن. توضیح مرحله‌به‌مرحله کمک می‌کند خطا بازسازی شود و راه‌حل دقیق‌تری ارائه شود."],
      ["پیگیری سفارش یا محتوا", "برای پرسش دربارهٔ سفارش یا محتوای منتشرشده، شناسهٔ مربوط را از داخل حساب خود پیدا کن. رمز عبور، کد یک‌بارمصرف یا اطلاعات پرداخت را در پیام پشتیبانی قرار نده."],
      ["امنیت حساب", "اگر به فعالیت ناشناس مشکوک شدی، نشست‌های فعال را بررسی و رمز عبور را از مسیر رسمی تغییر بده. کد ورود را حتی برای افرادی که خود را پشتیبان معرفی می‌کنند ارسال نکن."]
    ]
  },
  "/privacy": {
    title: "اصول حریم خصوصی و حفاظت از اطلاعات",
    intro: "حریم خصوصی به این معناست که اطلاعات حساب و محتوای شخصی فقط برای هدف‌های روشن و با دسترسی کنترل‌شده استفاده شوند. هنگام استفاده از هر خدمت آنلاین، اطلاعاتی را که منتشر می‌کنی با دقت انتخاب کن.",
    sections: [
      ["اطلاعات حساب", "اطلاعاتی مانند نشانی ایمیل برای ورود و مدیریت حساب استفاده می‌شود. اطلاعات ورود و کدهای تأیید را محرمانه نگه دار و از دستگاه‌های عمومی پس از پایان کار خارج شو."],
      ["محتوای منتشرشده", "پیش از انتشار عکس یا ویدئو، مطمئن شو اجازهٔ انتشار آن را داری و جزئیات خصوصی مانند نشانی منزل یا اطلاعات تماس در تصویر دیده نمی‌شود."],
      ["درخواست‌های حریم خصوصی", "اگر دربارهٔ اطلاعات حساب یا محتوای خود پرسشی داری، از مسیر پشتیبانی رسمی درخواست ثبت کن. هرگز رمز عبور یا کد تأیید را برای اثبات مالکیت حساب ارسال نکن."]
    ]
  }
}

function addEditorialContent() {
  let path = window.location.pathname
  while (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  if (!path) path = "/"
  const root = document.querySelector<HTMLElement>("#root main, #root [role='main']")
  if (!root) return

  // Keep SPA navigation in sync: remove the previous route's editorial section,
  // including when navigating from a public page to a private or unsupported route.
  const existing = root.querySelector<HTMLElement>("[data-nn-editorial]")
  if (existing?.dataset.nnEditorial === path) return
  existing?.remove()

  const content = editorialContent[path]
  if (!content || path === "/account" || path === "/cart" || path === "/notifications") return

  const section = document.createElement("section")
  section.className = "nn-editorial"
  section.dataset.nnEditorial = path
  section.setAttribute("aria-labelledby", "nn-editorial-title")
  const heading = document.createElement("h2")
  heading.id = "nn-editorial-title"
  heading.textContent = content.title
  section.appendChild(heading)
  const intro = document.createElement("p")
  intro.className = "nn-editorial__intro"
  intro.textContent = content.intro
  section.appendChild(intro)
  const grid = document.createElement("div")
  grid.className = "nn-editorial__grid"
  for (const [title, body] of content.sections) {
    const article = document.createElement("article")
    const subheading = document.createElement("h3")
    subheading.textContent = title
    const paragraph = document.createElement("p")
    paragraph.textContent = body
    article.append(subheading, paragraph)
    grid.appendChild(article)
  }
  section.appendChild(grid)
  root.appendChild(section)
}

