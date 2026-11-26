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
  "/guide": { title: "راهنمای چهل‌تکه‌دوزی | نقش‌نگار", description: "راهنمای الگوها، ابزارها، روش‌های برش و نکته‌های کاربردی برای یادگیری چهل‌تکه‌دوزی." },
  "/learn": { title: "مسیر یادگیری چهل‌تکه‌دوزی | نقش‌نگار", description: "از تمرین‌های مقدماتی تا شناخت بلوک‌ها و تکنیک‌های چهل‌تکه‌دوزی، مسیر یادگیری خود را دنبال کن." },
  "/shop/parche": { title: "پارچه و متریال چهل‌تکه‌دوزی | فروشگاه نقش‌نگار", description: "پارچه‌ها و متریال مناسب پروژه‌های چهل‌تکه‌دوزی را بررسی کن و جنس و رنگ موردنیاز طرحت را انتخاب کن." },
  "/support": { title: "پشتیبانی نقش‌نگار | راهنمای کاربران", description: "برای راهنمایی استفاده از نقش‌نگار، پیگیری درخواست‌ها و دریافت پاسخ پرسش‌های خود با پشتیبانی همراه شو." },
  "/privacy": { title: "حریم خصوصی | نقش‌نگار", description: "در سیاست حریم خصوصی نقش‌نگار با شیوهٔ نگهداری، استفاده و حفاظت از اطلاعات کاربران آشنا شو." },
  "/account": { title: "حساب کاربری | نقش‌نگار", description: "مدیریت حساب شخصی و تنظیمات کاربری نقش‌نگار.", private: true },
  "/cart": { title: "سبد خرید | نقش‌نگار", description: "مرور و مدیریت اقلام انتخاب‌شده در سبد خرید نقش‌نگار.", private: true },
  "/notifications": { title: "اعلان‌های شخصی | نقش‌نگار", description: "مشاهدهٔ اعلان‌ها و پیام‌های مربوط به حساب کاربری.", private: true },
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
  if (!nav || nav.querySelector("[data-nn-studio-link]")) return
  const sample = nav.querySelector<HTMLAnchorElement>("a[href]")
  const link = document.createElement("a")
  link.href = "/quilt-studio-preview.html"
  link.textContent = "استودیوی لحاف"
  link.setAttribute("data-nn-studio-link", "true")
  link.setAttribute("aria-label", "استودیوی طراحی لحاف نقش‌نگار")
  if (sample) link.className = sample.className
  nav.appendChild(link)
}

function syncSemanticHeadings() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  const root = document.querySelector<HTMLElement>("#root main, #root [role='main']") ?? document.getElementById("root")
  if (!root) return

  if (path === "/reels" && !root.querySelector("h1")) {
    const heading = document.createElement("h1")
    heading.dataset.nnRouteHeading = "true"
    heading.textContent = "ویدئوهای کوتاه چهل‌تکه‌دوزی"
    heading.style.cssText = "margin:0 0 1rem;font-size:clamp(1.25rem,2vw,1.75rem);font-weight:700;line-height:1.4"
    root.prepend(heading)
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
const observer = new MutationObserver(() => queueMicrotask(() => { syncRouteMetadata(); syncSemanticHeadings(); addStudioNavLink() }))
observer.observe(appRoot, { childList: true, subtree: true })
syncRouteMetadata()
