# اصلاح خزیدن موتورهای جست‌وجو — ۲۰۲۶-۱۱-۲۶

## شواهد قبل از اصلاح
- OpenSEO crawl ساده فقط صفحهٔ اصلی را یافت؛ h1Count=0 و wordCount=0 در HTML اولیه ثبت شد.
- درخواست‌های production برای /sitemap.xml و /robots.txt به‌دلیل fallback مسیر SPA، به index.html پاسخ می‌دادند.
- مسیر /designer نیز HTML shell یکسان را برمی‌گرداند؛ بنابراین metadata اختصاصی باید پس از navigation سمت کاربر تنظیم شود و prerender/SSR همچنان یک کار جداگانه است.

## تغییرات این PR
- افزودن فایل‌های ایستای public/robots.txt و public/sitemap.xml به overlay مشترک، تا در build وب و Capacitor از همان منبع کپی شوند.
- افزودن metadata مسیرمحور برای عنوان، توضیح، canonical، Open Graph و Twitter Card.
- علامت‌گذاری مسیرهای خصوصی شناخته‌شدهٔ /admin و /stash با noindex,nofollow و حذف canonical آن‌ها.
- فهرست sitemap محدود به مسیرهای عمومی اصلی است؛ پنل مدیریت و انبار شخصی در آن قرار نمی‌گیرند.

## محدودیت و معیار تأیید
- این تغییر، کشف مسیرها و metadata پس از اجرای JavaScript را بهتر می‌کند؛ به‌تنهایی SSR یا prerender ایجاد نمی‌کند.
- پس از merge و deployment باید /robots.txt پاسخ متن ساده، /sitemap.xml پاسخ XML معتبر، و همهٔ URLهای فهرست‌شده پاسخ 200 بدهند.
- crawl مجدد OpenSEO باید بیش از یک مسیر را کشف کند؛ برای سنجش محتوای رندرشده، JavaScript crawl جداگانه لازم است.
