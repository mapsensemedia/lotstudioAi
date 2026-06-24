# Linking LotStudio to your Lovable site

This folder is **reference code for your Lovable / Supabase project** — it is not part
of the LotStudio app itself. It lets a "Clean photo" button on your website send an
inventory car image to LotStudio, get back a studio-cleaned version, and save it to
your inventory.

```
Lovable button → Supabase Edge Function (clean-photo) → LotStudio /api/integrations/clean
                          ↑ holds the secret key            ↓ returns cleaned PNG
                 uploads cleaned PNG to Supabase Storage ←──┘
```

The secret API key lives **only** inside the Edge Function, never in browser code.

---

## Step 1 — Set the shared secret on LotStudio (Render)

1. Generate a long random key:
   ```bash
   openssl rand -hex 32
   ```
2. In the Render dashboard → your `lotstudio-ai` service → **Environment**, add:
   - `INTEGRATION_API_KEY` = the value from step 1
3. Commit & push the LotStudio repo changes (the new `/api/integrations/clean` route)
   to `main` so Render redeploys. Or trigger the deploy hook.

## Step 2 — Add the Edge Function in Lovable's Supabase

1. Copy `supabase/functions/clean-photo/index.ts` (in this folder) into your Lovable
   project's Supabase functions. Easiest path: open Lovable, ask it to
   **"add a Supabase Edge Function named `clean-photo`"**, then paste the file.
   (Or with the CLI: `supabase functions deploy clean-photo`.)
2. Set the function's secrets (Supabase → Project Settings → Edge Functions → Secrets):
   - `LOTSTUDIO_URL` = `https://<your-lotstudio>.onrender.com`
   - `LOTSTUDIO_API_KEY` = the same key from Step 1
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.)

## Step 3 — Wire the button in your Lovable UI

Tell Lovable something like:

> On each car in the inventory, add a **"Clean photo"** button. When clicked, call the
> `clean-photo` Edge Function with the car's image URL, show a loading spinner, then
> replace the displayed image with the returned cleaned URL.

The underlying call it should generate:

```ts
const { data, error } = await supabase.functions.invoke('clean-photo', {
  body: {
    image_url: car.image_url,                 // existing public URL of the photo
    target_bucket: 'inventory',               // your Storage bucket
    target_path: `cleaned/${car.id}.png`,     // where to save the cleaned copy
    preset: 'studio_white',                   // see presets below
    shot_type: 'exterior',                    // 'exterior' | 'interior' | 'detail'
  },
});

if (error) {
  // show an error toast
} else {
  const cleanedUrl = data.url;
  // update the car row, e.g.:
  // await supabase.from('cars').update({ image_url: cleanedUrl }).eq('id', car.id);
}
```

> Tip: save to a **new** path (`cleaned/...`) rather than overwriting the original, so
> you always keep the source photo.

---

## Options

**Presets** (`preset`): `studio_white`, `studio_gray`, `showroom`, `outdoor`,
`neutral_white`, `ai_showroom`, `ai_outdoor`, `ai_luxury`.

**Shot type** (`shot_type`):
- `exterior` — replaces the background with the studio scene; output is 1536×1024.
- `interior` / `detail` — cleans clutter/reflections but keeps the original framing.

## Notes & limits

- **Timing:** one image takes ~20–90s (occasionally up to ~3 min). The browser shows a
  spinner while it runs. If you ever process many at once, queue them one at a time.
- **The car is never altered** — only the background/surroundings change. That's enforced
  by LotStudio's prompt.
- **Cost:** each clean is one OpenAI image-edit call, billed on the OpenAI key set in Render.
- **Security:** never put `LOTSTUDIO_API_KEY` in client/browser code — only in the
  Edge Function secrets. If it ever leaks, rotate it in both Render and Supabase.
