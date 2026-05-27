# HangiYıl Gemini API Tarihte Bugün Kurulumu

Eklenen dosya:
- /api/tarihte-bugun.js

Ne yapar:
Ana sayfadaki Tarihte Bugün kartı önce Gemini API ile bugünün tarihine göre 2-3 olay üretir.
API çalışmazsa mevcut statik HY_TODAY verisine geri döner.

Vercel ayarı:
Settings > Environment Variables

Name:
GEMINI_API_KEY

Value:
Google AI Studio API anahtarın

Kaydettikten sonra yeniden deploy et.

Canlı test:
https://hangiyil.com/api/tarihte-bugun
