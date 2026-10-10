# Bon-Bon — Railway ma'lumotlarini saqlash

## Nimalar tuzatildi
- Serverdagi Django sessiyalari ma'lumotlar bazasida saqlanadi va brauzer yopilganda tugamaydi.
- Sinxronlash paytida serverda hali bo'lmagan joriy foydalanuvchining lokal post/Reels/Storylari avtomatik ravishda o'chirib yuborilmaydi; ular serverga qayta yuboriladi.
- Railway'da doimiy baza sozlanmagan bo'lsa, loyiha vaqtinchalik `/tmp` bazada jim ishlash o'rniga ishga tushishni to'xtatadi. Bu yangi deploydan keyin ma'lumotlar yo'qolayotgandek ko'rinishining oldini oladi.
- Dizayn va sahifalar o'zgartirilmadi.

## Railway'da majburiy sozlash
1. Railway loyihasini oching.
2. **New → Database → PostgreSQL** orqali PostgreSQL qo'shing.
3. PostgreSQL xizmatidan `DATABASE_URL` connection variable mavjudligini tekshiring.
4. Django/web service Variables bo'limida PostgreSQL'ning `DATABASE_URL` qiymati ulangan bo'lsin. Railway reference variable ishlatsangiz, PostgreSQL xizmatining `DATABASE_URL` qiymatiga bog'lang.
5. Django web service Variables bo'limiga kuchli, o'zgarmaydigan `SECRET_KEY` qo'shing. Masalan, lokalda `python -c "import secrets; print(secrets.token_urlsafe(50))"` bilan yarating va qiymatini Railway'ga kiriting. Uni keyingi deploylarda almashtirmang.
6. GitHub'ga yangilangan loyiha fayllarini yuborib, Railway'da redeploy qiling.
7. Deploy tugagach, saytga kiring, profil rasmini o'zgartiring, post va Reels joylang, sahifani `Ctrl+R` bilan yangilang va ikkinchi akkauntdan profil rasmini tekshiring.

**Muhim:** Agar oldingi deployda SQLite `/tmp` ichida bo'lgan bo'lsa, u yerdagi avvalgi post/Reelslar qayta ishga tushganda tiklanmasligi mumkin. Eski ma'lumotlar bor Railway volume yoki `db.sqlite3` fayli bo'lsa, PostgreSQL'ga ko'chirishni alohida bajaring. Ushbu kod eski SQLite ma'lumotlarini o'z-o'zidan PostgreSQL'ga ko'chirmaydi.

## Muqobil
PostgreSQL o'rniga Railway Volume'ni `/data` manziliga ulang. SQLite faqat shu doimiy volume ichida saqlansa, deploylar orasida saqlanadi. Ko'p foydalanuvchili production uchun PostgreSQL tavsiya qilinadi. PostgreSQL yoki Volume ulanmagan bo'lsa, Railway startup'i endi vaqtinchalik bazada ishlash o'rniga tushunarli xabar bilan to'xtaydi.

## Tekshiruv
Frontend build bu muhitda to'liq yakunlanmadi: ZIP ichidagi `node_modules` Linux native Vite/Rolldown binding'ini o'z ichiga olmaydi. Railway Docker build `npm ci` orqali bog'liqliklarni toza o'rnatishi kerak. Deploydan keyin yuqoridagi amaliy testlarni bajaring.
