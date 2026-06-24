// Supabase Edge Function: clean-photo
// ---------------------------------------------------------------------------
// Deploy this in your LOVABLE project's Supabase (not in the LotStudio repo).
// It is the secure bridge between your website and the LotStudio cleaning API:
//   1. Receives an inventory image URL from the browser.
//   2. Calls LotStudio's /api/integrations/clean with the secret API key
//      (the key lives ONLY here, never in the browser).
//   3. Uploads the cleaned PNG back into Supabase Storage.
//   4. Returns the new public URL.
//
// Required Supabase secrets (Project Settings -> Edge Functions -> Secrets, or
//   `supabase secrets set ...`):
//   LOTSTUDIO_URL       e.g. https://lotstudio-ai.onrender.com
//   LOTSTUDIO_API_KEY   same value you set as INTEGRATION_API_KEY on Render
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// ---------------------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let payload: {
    image_url?: string;
    target_bucket?: string;
    target_path?: string;
    preset?: string;
    shot_type?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const { image_url, target_bucket, target_path, preset, shot_type } = payload;
  if (!image_url || !target_bucket || !target_path) {
    return json({ error: 'missing image_url, target_bucket, or target_path' }, 400);
  }

  const lotUrl = Deno.env.get('LOTSTUDIO_URL');
  const lotKey = Deno.env.get('LOTSTUDIO_API_KEY');
  if (!lotUrl || !lotKey) return json({ error: 'integration_not_configured' }, 500);

  // 1. Ask LotStudio to clean the image.
  let cleaned: { image_base64?: string };
  try {
    const res = await fetch(`${lotUrl.replace(/\/$/, '')}/api/integrations/clean`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': lotKey },
      body: JSON.stringify({
        image_url,
        preset: preset ?? 'studio_white',
        shot_type: shot_type ?? 'exterior',
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return json({ error: 'lotstudio_failed', status: res.status, detail: detail.slice(0, 300) }, 502);
    }
    cleaned = await res.json();
  } catch (err) {
    return json({ error: 'lotstudio_unreachable', detail: String(err) }, 502);
  }

  if (!cleaned.image_base64) return json({ error: 'no_image_returned' }, 502);

  // 2. Decode base64 -> bytes.
  const binary = atob(cleaned.image_base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  // 3. Upload the cleaned PNG back to Storage (service role bypasses RLS).
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error: upErr } = await supabase.storage
    .from(target_bucket)
    .upload(target_path, bytes, { contentType: 'image/png', upsert: true });
  if (upErr) return json({ error: 'upload_failed', detail: upErr.message }, 500);

  const { data: pub } = supabase.storage.from(target_bucket).getPublicUrl(target_path);
  return json({ url: pub.publicUrl });
});
