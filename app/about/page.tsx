import Link from 'next/link';

const STATS = [
  { value: '100%', label: 'of vehicle pixels preserved per export audit' },
  { value: 'Seconds', label: 'to swap in a studio backdrop' },
  { value: 'Bulk-ready', label: 'exports with per-image audit metadata' },
];

const PROMISES = [
  'The vehicle in the output is the same vehicle from your photo — same body, same trim, same paint.',
  'No badge, emblem, or model name is changed, added, or removed.',
  'Wheels, tires, and ride height stay exactly as photographed.',
  'License plates, dealer stickers, and window text are left as they appear.',
  'Headlights, taillights, mirrors, and trim keep their original shape and finish.',
  'Only the background behind and around the vehicle is replaced.',
];

export default function AboutPage() {
  return (
    <div className="space-y-20">
      <section className="text-center pt-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Built for car dealerships
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          LotStudio AI gives sales teams a fast way to put a clean studio backdrop behind every
          inventory photo — without ever touching the vehicle itself.
        </p>
      </section>

      <section className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5 text-slate-700">
          <h2 className="text-2xl font-semibold text-slate-900">Why we built it</h2>
          <p>
            Walk any dealership lot and you'll see the same problem in every listing: gravel,
            other inventory, dumpsters, harsh shadows, a competitor's sign in the frame. Buyers
            scroll past those photos. Sales teams know it, but reshooting every car in a real
            studio isn't realistic.
          </p>
          <p>
            We built LotStudio AI to fix that one specific thing — the background. Upload the
            shot you already have, pick a studio backdrop, and get back a version of the same
            vehicle on a clean background. No retouching. No "enhancement." No changes to the
            car.
          </p>
          <p>
            Every export ships with an audit so your team and your compliance group can verify
            that the vehicle pixels in the final image match the vehicle pixels in the source.
            The background is replaced. Everything else is the photo you took.
          </p>
        </div>
        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            By the numbers
          </div>
          <ul className="mt-4 space-y-5">
            {STATS.map((s) => (
              <li key={s.label}>
                <div className="text-2xl font-semibold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-600 mt-1">{s.label}</div>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Our promise</h2>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Dealership listings are regulated and reputational. These are the commitments built
          into every job we run.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5 12l4 4L19 7" />
                </svg>
              </span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-indigo-600 text-white px-8 py-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          See it on your own inventory
        </h2>
        <p className="mt-3 text-indigo-100 max-w-xl mx-auto">
          Upload a batch and review the results in minutes. Your vehicle, new backdrop.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-white px-6 py-3 text-indigo-700 font-medium hover:bg-indigo-50"
          >
            Open dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
