import Link from 'next/link';

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    cadence: '/mo',
    blurb: 'For single-location lots getting started.',
    features: [
      'Up to 250 background replacements / mo',
      '4 studio background presets',
      'ZIP export with audit',
      'Email support',
    ],
    cta: 'Start with Starter',
    popular: false,
  },
  {
    name: 'Dealership',
    price: '$199',
    cadence: '/mo',
    blurb: 'For active sales lots running daily inventory.',
    features: [
      'Up to 1,500 background replacements / mo',
      'All studio background presets',
      'Bulk upload + approvals',
      'Priority processing',
      'Email + chat support',
    ],
    cta: 'Choose Dealership',
    popular: true,
  },
  {
    name: 'Group',
    price: 'Custom',
    cadence: '',
    blurb: 'For dealer groups with multiple rooftops.',
    features: [
      'Unlimited background replacements',
      'Multi-location workspaces',
      'SSO + role-based access',
      'Custom backdrops on request',
      'Dedicated success manager',
    ],
    cta: 'Talk to sales',
    popular: false,
  },
];

const COMPARE_ROWS: { feature: string; values: [string, string, string] }[] = [
  { feature: 'Monthly background replacements', values: ['250', '1,500', 'Unlimited'] },
  { feature: 'Studio background presets', values: ['4', 'All', 'All + custom'] },
  { feature: 'Bulk upload', values: ['—', 'Yes', 'Yes'] },
  { feature: 'Per-image audit in export', values: ['Yes', 'Yes', 'Yes'] },
  { feature: 'Priority processing', values: ['—', 'Yes', 'Yes'] },
  { feature: 'Multi-location workspaces', values: ['—', '—', 'Yes'] },
  { feature: 'SSO + roles', values: ['—', '—', 'Yes'] },
  { feature: 'Support', values: ['Email', 'Email + chat', 'Dedicated'] },
];

const FAQS = [
  {
    q: 'What counts as an image?',
    a: 'One image equals one successful background replacement on one source photo. Rejected results do not count toward your monthly total.',
  },
  {
    q: 'Do you store my photos?',
    a: 'Source photos are kept only as long as needed to process and export your jobs. You can request deletion at any time, and Group plans include configurable retention.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Monthly plans can be canceled any time from your account — you keep access through the end of the billing period.',
  },
  {
    q: 'What about overages?',
    a: 'If you exceed your monthly allowance we will alert you in-app before charging anything. We will help you size into the right plan.',
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-16">
      <section className="text-center pt-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Simple pricing for inventory teams
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          Pick the volume that fits your lot. Every plan includes the per-image audit so you can
          verify the vehicle was not altered.
        </p>
        <div className="mt-6 inline-block rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
          Pricing in beta — contact us for early-access rates.
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl bg-white p-6 shadow-sm flex flex-col ${
              p.popular ? 'ring-2 ring-indigo-600 relative' : 'ring-1 ring-slate-200'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                Most popular
              </div>
            )}
            <div className="font-semibold text-slate-900">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{p.price}</span>
              {p.cadence && <span className="text-sm text-slate-500">{p.cadence}</span>}
            </div>
            <p className="mt-2 text-sm text-slate-600">{p.blurb}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mt-0.5 text-indigo-600 shrink-0"
                  >
                    <path d="M5 12l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={p.name === 'Group' ? '/contact' : '/dashboard'}
              className={`mt-6 inline-block text-center rounded-md px-4 py-2 text-sm font-medium ${
                p.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:ring-indigo-300'
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-900">Compare plans</h2>
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left font-medium px-4 py-3">Feature</th>
                <th className="text-left font-medium px-4 py-3">Starter</th>
                <th className="text-left font-medium px-4 py-3">Dealership</th>
                <th className="text-left font-medium px-4 py-3">Group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 text-slate-700">{row.feature}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="px-4 py-3 text-slate-600">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-900">Pricing questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="font-semibold text-slate-900">{f.q}</div>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
