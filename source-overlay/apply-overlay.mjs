import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const overlayRoot = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(process.argv[2] ?? '')
if (!process.argv[2] || !existsSync(join(projectDir, 'package.json'))) {
  throw new Error('Pass the extracted naqsh-negar project directory as the first argument.')
}
for (const entry of [
  'src/app/premium-foundation.css', 'src/app/visual-interactions.ts',
  'src/app/SocialPage.tsx', 'src/app/social.css',
  'src/app/SocialModerationAdminPage.tsx', 'src/app/social-moderation-admin.css',
  'src/app/FabricStashPage.tsx', 'src/app/fabric-stash.css',
  'src/lib/social-validation.ts', 'supabase/functions/_shared/social-validation.test.ts',
  'supabase/migrations/20261126093000_qnr_social_network.sql',
  'supabase/migrations/20261126095938_qnr_social_metrics_security_and_indexes.sql',
  'supabase/migrations/20261126100341_qnr_social_acl_hardening.sql',
  'supabase/migrations/20261126102533_fix_storage_policy_relation_grants.sql',
  'supabase/migrations/20261126102552_fix_storage_policy_rls_subquery_grants.sql',
  'supabase/migrations/20261126103000_qnr_fabric_stash_inventory.sql',
  'supabase/migrations/20261126110000_admin_social_moderation_workflow.sql'
]) {
  const source = join(overlayRoot, entry)
  const target = join(projectDir, entry)
  mkdirSync(dirname(target), { recursive: true })
  cpSync(source, target)
}
const appPath = join(projectDir, 'src/app/App.tsx')
let app = readFileSync(appPath, 'utf8')
function replaceOnce(before, after) {
  const occurrences = app.split(before).length - 1
  if (occurrences !== 1) throw new Error('Expected one App.tsx anchor, found ' + occurrences + ': ' + before.slice(0, 90))
  app = app.replace(before, after)
}
replaceOnce(
  "import { ArrowLeft, Bell, BookOpen, Bookmark, Check, Compass, Home, Menu, MessageCircle, ShoppingBag, ShoppingCart, UserRound, X } from 'lucide-react'",
  "import { ArrowLeft, Bell, BookOpen, Bookmark, Check, Compass, Home, Menu, MessageCircle, ShoppingBag, ShoppingCart, UserRound, Users, Package, X } from 'lucide-react'",
)
replaceOnce("import { CommunityPage } from './CommunityPage'", "import { CommunityPage } from './CommunityPage'\nimport { SocialPage } from './SocialPage'\nimport { SocialModerationAdminPage } from './SocialModerationAdminPage'\nimport { FabricStashPage } from './FabricStashPage'\nimport './premium-foundation.css'\nimport './visual-interactions'")
replaceOnce("  { to: '/', label: 'خانه', Icon: Home },\n  { to: '/shop', label: 'فروشگاه', Icon: ShoppingBag },", "  { to: '/', label: 'خانه', Icon: Home },\n  { to: '/social', label: 'جامعه', Icon: Users },\n  { to: '/stash', label: 'انبار پارچه', Icon: Package },\n  { to: '/shop', label: 'فروشگاه', Icon: ShoppingBag },")
replaceOnce("  { to: '/projects', label: 'پروژه‌ها', Icon: Compass },\n", "")
replaceOnce("  ['/courses', 'دوره‌ها'], ['/guide', 'دانشنامه'], ['/designer', 'طراح بلوک'], ['/gallery', 'گالری'],", "  ['/social', 'جامعه و فید'], ['/reels', 'ریلز'], ['/admin/social-moderation', 'مدیریت جامعه'], ['/projects', 'پروژه‌ها'], ['/courses', 'دوره‌ها'], ['/guide', 'دانشنامه'], ['/designer', 'طراح بلوک'], ['/gallery', 'گالری'],")
replaceOnce("        <Route path=\"/gallery\" element={<GalleryPage />} />", "        <Route path=\"/gallery\" element={<GalleryPage />} />\n        <Route path=\"/social\" element={<SocialPage />} />\n        <Route path=\"/reels\" element={<SocialPage initialTab=\"reels\" />} />\n        <Route path=\"/admin/social-moderation\" element={<SocialModerationAdminPage />} />\n        <Route path=\"/stash\" element={<FabricStashPage />} />")
writeFileSync(appPath, app)
const indexPath = join(projectDir, 'index.html')
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf8')
  const refreshScript = '<script id="nn-sw-refresh">if ("serviceWorker" in navigator) { navigator.serviceWorker.getRegistrations().then(function (items) { items.forEach(function (registration) { registration.update() }) }); navigator.serviceWorker.addEventListener("controllerchange", function () { if (!window.__nnSwReloaded) { window.__nnSwReloaded = true; window.location.reload() } }) }</script>'
  if (!html.includes('id="nn-sw-refresh"')) {
    if (!html.includes('</head>')) throw new Error('index.html is missing closing head tag')
    html = html.replace('</head>', refreshScript + '</head>')
    writeFileSync(indexPath, html)
  }
}
console.log('Applied Naghsh Negar social, moderation and premium visual overlays.')
