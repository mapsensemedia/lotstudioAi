import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const back = new URL('/login', url.origin);
      back.searchParams.set('error', error.message);
      return NextResponse.redirect(back);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
