'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

type Mode = 'password' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      });
      if (err) throw err;
      setMagicSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Could not send sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
      <p className="text-slate-600 mb-6 text-sm">
        Access is invite-only. Sign in with your email and password, or request a one-time link.
      </p>

      <div className="mb-5 inline-flex rounded-md border border-slate-300 bg-slate-50 p-1 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode('password');
            setError(null);
            setMagicSent(false);
          }}
          className={`rounded px-3 py-1.5 font-medium transition ${
            mode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('magic');
            setError(null);
          }}
          className={`rounded px-3 py-1.5 font-medium transition ${
            mode === 'magic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Email link
        </button>
      </div>

      {mode === 'password' && (
        <form onSubmit={handlePassword} className="space-y-3">
          <label className="block text-sm">
            <span className="block text-slate-600 mb-1">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="you@dealership.com"
            />
          </label>
          <label className="block text-sm">
            <span className="block text-slate-600 mb-1">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      {mode === 'magic' && (
        <>
          {magicSent ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Check <strong>{email}</strong> for a sign-in link. If you don&apos;t see one, your address
              may not be on the allowlist — contact your admin.
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="block text-sm">
                <span className="block text-slate-600 mb-1">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  placeholder="you@dealership.com"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !email}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                {busy ? 'Sending…' : 'Send sign-in link'}
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </>
      )}
    </main>
  );
}
