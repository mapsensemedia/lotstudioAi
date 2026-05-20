'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [dealership, setDealership] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast({
        kind: 'success',
        title: 'Thanks — we’ll follow up shortly.',
        description: 'A teammate will reach out within one business day.',
      });
      setName('');
      setDealership('');
      setEmail('');
      setMessage('');
      setSubmitting(false);
    }, 250);
  }

  return (
    <div className="space-y-12">
      <section className="pt-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Talk to us
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          Questions about bulk pricing, group rollouts, or custom backdrops? Send us a note.
        </p>
      </section>

      <section className="grid gap-10 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block text-slate-700 mb-1">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="text-sm">
              <span className="block text-slate-700 mb-1">Dealership</span>
              <input
                required
                value={dealership}
                onChange={(e) => setDealership(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block text-slate-700 mb-1">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="text-sm block">
            <span className="block text-slate-700 mb-1">Message</span>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </form>

        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Email
            </div>
            <a
              href="mailto:hello@lotstudio.ai"
              className="mt-1 block text-slate-900 hover:text-indigo-600"
            >
              hello@lotstudio.ai
            </a>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Hours
            </div>
            <div className="mt-1 text-slate-700 text-sm">Mon–Fri, 9am–6pm CT</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Response time
            </div>
            <div className="mt-1 text-slate-700 text-sm">
              We typically reply within 1 business day.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
