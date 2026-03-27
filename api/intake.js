import OpenAI from "openai";

const PATTERNS = [
  "Põrna Qi defitsiit",
  "Põrna Yang defitsiit",
  "Neeru Yang defitsiit",
  "Neeru Yin defitsiit",
  "Südame vere defitsiit",
  "Mao Yin defitsiit",
  "Maksa Qi stagnatsioon",
  "Maksa Yang tõus",
  "Flegm-niiskus",
  "Niiskus-kuumus",
  "Vere stagnatsioon"
];

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function systemPrompt() {
  return `
Sa oled SAN diagnostika assistent.
Sinu toon on vaikne, täpne ja lühike.
Sa ei räägi nagu jutukas chatbot.
Sa töötad hiina meditsiini mustritega ja valid lõpuks ainult ühe peamise mustri.

Lubatud mustrid:
${PATTERNS.map((x) => `- ${x}`).join("\n")}

Töövoog:
1. loe kasutaja vabateksti
2. tee algne hüpotees
3. küsi korraga ainult üks täpsustav küsimus
4. kohanda järgmist küsimust eelmise vastuse põhjal
5. lõpeta kohe, kui kindlus on piisav; küsi maksimaalselt 5 küsimust
6. lõpus anna ainult üks peamine muster

Tagasta ALATI puhas JSON ilma markdownita.

Kui etapp on "question":
{
  "mode": "question",
  "questionNumber": 1,
  "question": "üks lühike küsimus eesti keeles",
  "options": ["variant 1", "variant 2", "variant 3"],
  "reasoningSummary": "väga lühike sisemine töömälu kokkuvõte eesti keeles, 1 lause"
}

Kui etapp on "result":
{
  "mode": "result",
  "pattern": "üks lubatud mustritest",
  "confidence": "madal" | "keskmine" | "kõrge",
  "interpretation": "2–4 lühikest SAN stiilis lauset eesti keeles",
  "lifestyle": ["...","...","..."],
  "food": ["...","...","..."],
  "herbs": ["...","..."],
  "points": ["ST36","SP6","LV3"],
  "reasoningSummary": "väga lühike kokkuvõte, miks see muster valiti"
}

Reeglid:
- ole konservatiivne
- ära nimeta haigusi
- ära liialda kindlusega
- ära paku rohkem kui üks muster
- kui vastustes on mitu võimalikku suunda, vali kõige vaiksemalt selgem
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { complaintText, qaHistory = [] } = req.body || {};
    if (!complaintText || !String(complaintText).trim()) {
      res.status(400).json({ error: "complaintText is required" });
      return;
    }

    const phase = qaHistory.length >= 5 ? "force_result" : "adaptive";
    const userPrompt = `
Etapp: ${phase}

Kasutaja algne kirjeldus:
${complaintText}

Senine küsimuste-vastuste ajalugu:
${qaHistory.length ? qaHistory.map((item, i) => `${i + 1}. K: ${item.question}\nV: ${item.answer}`).join("\n\n") : "Puudub"}

Otsus:
- kui kindlus on juba piisav, tagasta result
- muidu tagasta järgmine üks küsimus
- kui küsimusi on juba 5, tagasta result
`;

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt }
      ]
    });

    const text = response.output_text?.trim() || "{}";
    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({
      error: "AI request failed",
      details: String(error.message || error)
    });
  }
}