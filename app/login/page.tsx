'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/client';

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      });
      if (err) throw err;
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? 'Could not send sign-in link.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
      <p className="text-slate-600 mb-6 text-sm">
        Access is invite-only. Enter your email and we&apos;ll send you a sign-in link.
      </p>
      {sent ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Check <strong>{email}</strong> for a sign-in link. If you don&apos;t see one, your address
          may not be on the allowlist — contact your admin.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="block text-slate-600 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="you@dealership.com"
            />
          </label>
          <button
            type="submit"
            disabled={sending || !email}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {sending ? 'Sending…' : 'Send sign-in link'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </main>
  );
}
