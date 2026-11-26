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
const observer = new MutationObserver(() => queueMicrotask(syncRouteMetadata))
observer.observe(appRoot, { childList: true, subtree: true })
syncRouteMetadata()
