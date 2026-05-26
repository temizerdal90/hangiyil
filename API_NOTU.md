# Hangiyil.com API Notu

İleride yapılacak canlı arama özeti için hedef yapı:

- Sitede kayıt varsa: açılır pencerede bilgi kutusu çıkmaz, sadece ilgili sonuç kartları listelenir.
- Sitede kayıt yoksa: Gemini API ile 3-4 satırlık kısa bilgi üretilebilir.
- API anahtarı HTML/JS içine yazılmayacak.
- Vercel > Project Settings > Environment Variables içine `GEMINI_API_KEY` olarak eklenecek.
- Site JavaScript'i doğrudan Gemini'ye değil, Vercel Serverless Function'a istek atacak.
- Önerilen dosya yapısı:
  - `/api/quick-info.js`
  - `script.js` içinde fetch('/api/quick-info?q=...') mantığı

Bu entegrasyon yapılmadan önce içerik güvenliği, kota ve maliyet kontrolü ayrıca ayarlanmalı.
