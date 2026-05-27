export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Sadece GET isteği desteklenir." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY bulunamadı. Vercel Environment Variables içine eklenmeli."
      });
    }

    const now = new Date();

    // Türkiye saati zorunlu. Vercel sunucusu UTC çalışabildiği için dün/bugün karışmasını önler.
    const trDate = now.toLocaleDateString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "numeric",
      month: "long"
    });

    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now);

    const month = dateParts.find(p => p.type === "month")?.value || "01";
    const day = dateParts.find(p => p.type === "day")?.value || "01";
    const dateKey = month + "-" + day;

    const prompt = `
Sen HangiYıl sitesi için "Tarihte Bugün" kutusu hazırlayan Türkçe editörsün.

Bugünün tarihi: ${trDate}
Saat dilimi: Türkiye / Europe/Istanbul

Görev:
- Sadece ${trDate} günüyle ilişkili 2 veya 3 önemli olay seç.
- Türkiye, dünya, bilim, teknoloji, kültür, spor veya önemli kişiler olabilir.
- Emin olmadığın bilgi uydurma.
- Dünün veya yarının olaylarını yazma.
- Kısa ve güvenli yaz.
- Cevabı SADECE geçerli JSON olarak ver. Markdown kullanma.

JSON formatı:
{
  "label": "${trDate}",
  "items": [
    {
      "year": "1923",
      "title": "Kısa başlık",
      "text": "1 cümlelik açıklama."
    }
  ]
}
`;

    const payload = {
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: 0.35,
        topP: 0.85,
        maxOutputTokens: 900,
        responseMimeType: "application/json"
      }
    };

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        label: trDate,
        dateKey,
        items: [
          {
            year: "",
            title: "Canlı bilgi alınamadı",
            text: "Gemini API şu anda cevap vermedi; statik arşiv kullanılabilir."
          }
        ],
        error: "Gemini API hatası",
        details: data
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = {
        label: trDate,
        items: [
          {
            year: "",
            title: "Bugünün arşivi hazırlanıyor",
            text: "Canlı bilgi kutusu şu anda düzenleniyor."
          }
        ]
      };
    }

    let items = Array.isArray(parsed.items) ? parsed.items.slice(0, 3) : [];
    items = items.filter(x => x && (x.title || x.text));

    if (!items.length) {
      items = [
        {
          year: "",
          title: "Bugünün arşivi hazırlanıyor",
          text: "Bu tarih için canlı bilgi üretilemedi."
        }
      ];
    }

    return res.status(200).json({
      label: parsed.label || trDate,
      dateKey,
      items
    });
  } catch (err) {
    return res.status(500).json({
      error: "Sunucu hatası",
      message: err?.message || String(err)
    });
  }
}
