export default async function handler(req, res) {
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
    const trDate = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateKey = month + "-" + day;

    const prompt = `
Sen HangiYıl sitesi için "Tarihte Bugün" kutusu hazırlayan Türkçe editörsün.

Bugünün tarihi: ${trDate}

Görev:
- Bugünün tarihiyle ilişkili 2 veya 3 önemli olay seç.
- Türkiye, dünya, bilim, teknoloji, kültür, spor veya önemli kişiler olabilir.
- Emin olmadığın bilgi uydurma.
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
        temperature: 0.45,
        topP: 0.9,
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

    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 3) : [];
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
