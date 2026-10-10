# Bon-Bon — Railway deploy

Bu versiya frontend va backendni **bitta Railway service** ichida ishlatadi. `/plat/*` so‘rovlari shu domen ichida Django'ga proxy qilinadi.

## 1. Deploy

1. GitHub repo root'ini Railway'ga ulang.
2. Root Directory'ni o‘zgartirmang.
3. Root'dagi `Dockerfile` avtomatik ishlatiladi.
4. **PostgreSQL tavsiya qilinadi:** Railway loyihasiga PostgreSQL qo‘shib, web service Variables bo‘limida uning `DATABASE_URL` qiymatini ulang.
5. Muqobil: Railway Volume yarating va web service'ga `/data` manziliga ulang.

Railway production'da PostgreSQL yoki Volume sozlanmagan bo‘lsa, ilova vaqtinchalik SQLite bilan ishga tushadi va deploy logida ogohlantirish chiqaradi. Bu holatda ma'lumotlar restart yoki redeploy'da yo‘qolishi mumkin; doimiy saqlash uchun PostgreSQL yoki `/data` Volume ulang.

## 2. Variables

```text
DEBUG=0
SECRET_KEY=<uzun-maxfiy-key>
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

`DATABASE_URL` PostgreSQL xizmatiga Railway reference variable sifatida ulangan bo‘lishi kerak. PostgreSQL o‘rniga Volume ishlatsangiz `DATABASE_URL` shart emas, lekin Volume mount path `/data` bo‘lsin.

Ixtiyoriy:

```text
GOOGLE_CLIENT_ID=<Google OAuth client id>
```

## 3. Health check

```text
https://SIZNING-DOMENINGIZ/health
```

Javobda:

```json
{"status":"ok","database":"postgresql","data_persistent":true}
```

bo‘lishi kerak.

## 4. Admin akkaunt yaratish

Railway deploy qilingan service Console’da:

```sh
python manage.py shell -c "from django.conf import settings; print(settings.DATABASES['default']['NAME'])"
python manage.py migrate
python manage.py createsuperuser
```

Ko‘rsatilgan database PostgreSQL bo‘lishi yoki `/data/db.sqlite3` Volume ichida joylashishi kerak. Doimiy storage bo‘lmasa, ilova vaqtinchalik SQLite bilan ishga tushadi, ammo restart yoki redeploy'da ma'lumotlar yo‘qolishi mumkin.

Ilova ichidagi boshqaruv paneli `/admin` manzilida, Django’ning texnik admin paneli esa `/django-admin/` manzilida ochiladi.

## 5. Muhim

- `BACKEND_URL` kerak emas.
- Frontend va backend bir xil domen orqali ishlaydi.
- Django session cookie 30 kun saqlanadi.
- Brauzerdagi eski login yozuvi server sessioni bilan tekshiriladi; session mavjud bo‘lsa akkaunt avtomatik tiklanadi.
- Yozishmalar `SocialState` orqali server database'ida saqlanadi.
- Railway Volume `/data` akkauntlar, sessionlar, yozishmalar va media uchun persistent storage beradi.
- PostgreSQL ishlatilsa web service uchun SQLite Volume shart emas; media uchun Volume yoki object storage kerak.
- PostgreSQL yoki `/data` Volume bo‘lmasa, vaqtinchalik SQLite ishlaydi va ma'lumotlar yo‘qolishi mumkinligi haqida ogohlantirish chiqadi.
