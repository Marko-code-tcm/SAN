# SAN AI Vercel starter + audio

See versioon sisaldab:
- `index.html` — SAN kasutajaliides
- `api/intake.js` — AI küsimuste/järelduse endpoint
- `api/transcribe.js` — päris audio upload + OpenAI transkriptsioon

## Vercelis
1. Loo Vercelis uus projekt ja impordi see kaust
2. Lisa Environment Variable:
   - `OPENAI_API_KEY`
3. Deploy

## Kohalik test
```bash
npm install
vercel dev
```

## Mis töötab
- vabatekst
- brauseri dikteerimine
- audiofaili salvestus brauseris
- audio upload serverisse
- transkriptsioon OpenAI kaudu
- AI dünaamilised küsimused
- üks lõppjäreldus

## Märkus
API võti peab jääma ainult Verceli environment variable’isse.
Ära pane seda HTML faili ega kliendikoodi sisse.