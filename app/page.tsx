import Link from 'next/link';

const SAMPLES = [
  { caption: 'SUV → Studio White', after: 'Studio White' },
  { caption: 'Sedan → Showroom', after: 'Showroom' },
  { caption: 'Truck → Outdoor Lot', after: 'Outdoor Lot' },
];

const FEATURES = [
  {
    title: 'Bulk background replacement',
    body: 'Drop dozens of inventory shots and get studio backgrounds back, ready for your VDPs.',
    icon: (
      <path d="M3 7h13M3 12h13M3 17h9M19 7v10M16 14l3 3 3-3" />
    ),
  },
  {
    title: 'Vehicle pixels preserved',
    body: 'Per-image audit confirms the vehicle is byte-identical to the source — only the backdrop changes.',
    icon: (
      <path d="M12 3l8 4v6c0 4-3.5 7.5-8 8-4.5-.5-8-4-8-8V7l8-4zM9 12l2 2 4-4" />
    ),
  },
  {
    title: 'ZIP export with audit',
    body: 'Approve the shots you want and download a single ZIP including per-image audit metadata.',
    icon: (
      <path d="M4 4h12l4 4v12H4zM14 4v4h4M9 12v6M6 15h6" />
    ),
  },
  {
    title: 'Dealership-friendly workflow',
    body: 'Approvals, filters, and presets built around how a sales lot actually moves inventory.',
    icon: (
      <path d="M3 12l2-7h14l2 7M5 12h14v7H5zM8 16h2M14 16h2" />
    ),
  },
];

const STEPS = [
  { n: '01', title: 'Upload', body: 'Drag in your lot photos — JPG or PNG.' },
  { n: '02', title: 'Pick background', body: 'Choose a studio backdrop preset per batch.' },
  { n: '03', title: 'Review', body: 'Approve or reject results in a fast grid.' },
  { n: '04', title: 'Export', body: 'Download a ZIP with audit metadata included.' },
];

function Placeholder({ kind, label }: { kind: 'before' | 'after'; label: string }) {
  if (kind === 'before') {
    return (
      <div className="aspect-[4/3] rounded-md bg-slate-200 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400 opacity-60" />
        <span className="relative text-xs font-medium uppercase tracking-wide text-slate-600">
          {label}
        </span>
        <span className="relative mt-1 text-[10px] text-slate-500">Before</span>
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] rounded-md bg-white ring-1 ring-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-slate-100" />
      <span className="relative text-xs font-medium uppercase tracking-wide text-slate-700">
        {label}
      </span>
      <span className="relative mt-1 text-[10px] text-indigo-600">After</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="text-center pt-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
          New: bulk export with per-image audit
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
          Showroom-ready photos for your inventory
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          Swap messy lot backgrounds for a clean studio backdrop in seconds. Built for
          dealerships that want consistent, professional listings — your vehicle, new backdrop.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 shadow-sm"
          >
            Open dashboard
          </Link>
          <Link
            href="/pricing"
            className="inline-block rounded-md bg-white px-6 py-3 text-slate-800 font-medium ring-1 ring-slate-200 hover:ring-indigo-300"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Your vehicle pixels are preserved — only the background is replaced.
        </p>
      </section>

      {/* Sample gallery */}
      <section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Before and after, side by side
          </h2>
          <p className="mt-3 text-slate-600">
            The vehicle is the same in every pair. Only the background is replaced.
          </p>
        </div>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLES.map((s) => (
            <figure key={s.caption} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Placeholder kind="before" label="Lot photo" />
                <Placeholder kind="after" label="Studio background" />
              </div>
              <figcaption className="text-sm text-slate-600 text-center">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Built for dealership inventory pipelines
          </h2>
          <p className="mt-3 text-slate-600">
            Background replacement only. Nothing about the vehicle changes.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-10 w-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-3 text-slate-600">From parking lot to product page in four steps.</p>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm relative"
            >
              <div className="text-xs font-semibold text-indigo-600 tracking-widest">{s.n}</div>
              <div className="mt-2 font-semibold text-slate-900">{s.title}</div>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pricing teaser */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-900">Simple per-image pricing</div>
          <div className="text-sm text-slate-600">
            Pay only for the studio backgrounds you export.
          </div>
        </div>
        <Link
          href="/pricing"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          See pricing →
        </Link>
      </section>

      {/* Bottom CTA banner */}
      <section className="rounded-xl bg-indigo-600 text-white px-8 py-12 sm:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Ready to upgrade your listing photos?
        </h2>
        <p className="mt-3 text-indigo-100 max-w-xl mx-auto">
          Start replacing backgrounds in your inventory shots today. Your vehicle, new backdrop.
        </p>
        <div className="mt-7">
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
