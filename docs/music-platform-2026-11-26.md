# استودیوی موسیقی نقش‌نگار — فاز اول

تاریخ: ۲۶ نوامبر ۲۰۲۶

## معماری
- رابط: React + TypeScript در لایهٔ overlay و مسیر /music.
- پخش‌کننده: یک React root مستقل از Router؛ با تغییر مسیر صفحه از بین نمی‌رود.
- Backend: Supabase Postgres با RLS و Storage خصوصی.
- فایل‌ها: bucket خصوصی qnr-music، حداکثر ۵۰ MiB، فرمت‌های MP3/M4A/AAC/OGG/WAV/FLAC و کاور JPG/PNG/WebP.
- Playback: لینک امضاشدهٔ چهار ساعته برای کتابخانه و player.
- یکپارچگی فایل: SHA-256 هنگام بارگذاری.
- پلتفرم: وب و Android از کد React/Capacitor مشترک build می‌شوند؛ پخش پس‌زمینهٔ واقعی در Android هنگام بسته‌شدن اپ هنوز نیازمند MediaSession/Foreground Service بومی است.

## داده‌ها
- qnr_music_tracks: metadata، حقوق، مجوز، وضعیت moderation، مسیر صوت و کاور.
- qnr_music_playlists: فهرست‌های شخصی/عمومی.
- qnr_music_playlist_items: رابطه و ترتیب trackها.
- qnr_profile_music: قطعهٔ منتخب پروفایل با سطح دسترسی.
- qnr_music_preferences: فعال/غیرفعال بودن، ولوم، آخرین track و position.
- qnr_music_audit: تاریخچهٔ تغییر track.
- qnr_social_posts.soundtrack_track_id: اتصال اختیاری قطعه به ویدئوی اجتماعی؛ انتخاب قطعهٔ مجاز اکنون در composer ویدئو وجود دارد.

## امنیت و انتشار
- Storage private است؛ فایل عمومی به‌صورت public URL سرو نمی‌شود.
- دسترسی خواندن به مالک، مدیر، یا track منتشرشدهٔ عمومی محدود است.
- بارگذاری فقط در پوشهٔ کاربر و برای metadata ثبت‌شدهٔ pending مجاز است.
- انتشار/رد کردن فقط از طریق RLS و نقش admin واقعی انجام می‌شود.
- همهٔ trackها باید rights_confirmed باشند و در وضعیت pending وارد صف بررسی شوند.
- فایل صوتی و کاور در bucket خصوصی می‌مانند.
- عملیات INSERT/UPDATE/DELETE در track audit می‌شوند.
- Foreign keyهای جدید index شده‌اند.
- پلی‌لیست عمومی برای کاربران مهمان قابل مشاهده است، اما فقط قطعه‌های منتشرشده و عمومی در آن نمایش داده می‌شوند.

## Migrationهای اجراشده
- 20261126152326_qnr_music_platform_20261126
- 20261126152656_qnr_music_foreign_key_indexes
- 20261126152845_qnr_music_public_playlist_read

## محدودیت‌ها / فاز بعدی
- نمایش موسیقی منتخب در صفحهٔ پروفایل اصلی هنوز باید متصل شود.
- upload progress و resumable upload برای فایل‌های بزرگ هنوز در UI وجود ندارد؛ فعلاً از upload استاندارد Storage استفاده می‌شود.
- پخش پس‌زمینه بعد از minimize/lock در Android هنوز MediaSession و Foreground Service بومی ندارد.
- اعلان مجوز و صف گزارش/اعتراض به نقض حق نشر هنوز وجود ندارد.
- هیچ منبع موسیقی یا API تجاری متصل نیست؛ برای کاتالوگ تجاری به مجوز و قرارداد ارائه‌دهنده نیاز است.
- هیچ آهنگ نمونهٔ دارای حق نشر نامشخص seed نشده است.

## تست‌ها
- تست واحد برای MIME/extension، سقف حجم، فایل خالی و mismatch نوع محتوا در supabase/functions/_shared/music-validation.test.ts.
- GitHub Actions علاوه بر تست‌ها، وجود صفحه، پخش‌کننده، migration و مسیر /music را بررسی می‌کند.
- E2E واقعی با حساب‌های کاربر/مدیر و پخش فایل واقعی باید بعد از build و انتشار اجرا شود.