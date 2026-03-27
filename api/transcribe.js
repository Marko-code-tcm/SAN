import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false
  }
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseForm(req) {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { files } = await parseForm(req);
    const audioFile = files.audio?.[0] || files.audio;
    if (!audioFile?.filepath) {
      res.status(400).json({ error: "audio file is required" });
      return;
    }

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: "gpt-4o-mini-transcribe"
    });

    try { fs.unlinkSync(audioFile.filepath); } catch {}
    res.status(200).json({ text: transcription.text || "" });
  } catch (error) {
    res.status(500).json({
      error: "Transcription failed",
      details: String(error.message || error)
    });
  }
}