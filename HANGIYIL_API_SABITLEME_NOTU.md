Hangiyil Tarihte Bugün API sabitleme

- API cevabı bazen geç/boş gelince kart artık silinmez.
- Başarılı cevap aynı gün için localStorage'a kaydedilir.
- Yenilemede önce cache gösterilir, sonra API tazeler.
- API hata verirse mevcut statik kart veya cache korunur.
- API iki kez denenir: 0.5 sn ve 2.5 sn sonra.
