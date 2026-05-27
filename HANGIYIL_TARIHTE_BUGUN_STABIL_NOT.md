Hangiyil Tarihte Bugün stabil sürüm

Sorun:
Gemini API her sayfa yenilemede yeniden cevap ürettiği için bazen 2 olay, bazen 3 olay, bazen boş cevap veya eski tarih görünebiliyordu.

Karar:
Ana sayfadaki Tarihte Bugün kartı artık otomatik Gemini API ile değiştirilmiyor.
Kart, data.js içindeki HY_TODAY statik verisini kullanır. Bu yüzden stabil çalışır.

API dosyası korunuyor:
/api/tarihte-bugun.js

Ama ana sayfa otomatik API çağırmaz.
API daha sonra günlük cache sistemiyle tekrar bağlanabilir.
