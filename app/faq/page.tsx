type Item = { q: string; a: string };

const PRODUCT: Item[] = [
  {
    q: 'What does LotStudio AI actually do?',
    a: 'It replaces the background of a vehicle photo with a studio backdrop you pick. The vehicle in your shot stays exactly as photographed.',
  },
  {
    q: 'What does it not do?',
    a: 'It does not retouch, recolor, reshape, or otherwise modify the vehicle. It does not add or remove parts, badges, or trim. It only swaps the background.',
  },
  {
    q: 'Which backgrounds are available?',
    a: 'Studio White, Studio Gray, Showroom, Outdoor Lot, plus a few photoreal scene presets. Group plans can request custom backdrops.',
  },
  {
    q: 'Can I see results before I export?',
    a: 'Yes. Every job lands in a review grid where you can approve or reject individual results before exporting.',
  },
];

const INTEGRITY: Item[] = [
  {
    q: 'How do I know the vehicle was not changed?',
    a: 'Every export includes per-image audit metadata that verifies the vehicle pixels in the output match the source photo within strict tolerances.',
  },
  {
    q: 'What about badges, model names, and trim?',
    a: 'Untouched. Badges, emblems, model names, and trim shapes are preserved as they appear in your photo.',
  },
  {
    q: 'Wheels, ride height, and stance?',
    a: 'Preserved. We do not modify wheels, tires, or how the car sits in frame.',
  },
  {
    q: 'License plates and dealer stickers?',
    a: 'Left as you photographed them. If you want them removed, do it before upload — we do not edit the vehicle.',
  },
];

const OPERATIONS: Item[] = [
  {
    q: 'What file formats do you accept?',
    a: 'JPG and PNG, up to 25MB per file.',
  },
  {
    q: 'What format do exports come back in?',
    a: 'A single ZIP archive containing one image per approved job plus a per-image audit file.',
  },
  {
    q: 'What is inside the ZIP?',
    a: 'The processed images named to match your source files, and a manifest with audit metadata for each image.',
  },
  {
    q: 'How long does a batch take?',
    a: 'Most batches process in seconds per image. Larger batches stream into the review grid as they finish.',
  },
];

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {items.map((it) => (
          <details key={it.q} className="group">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-slate-900 list-none">
              <span>{it.q}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-sm text-slate-600">{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function FaqPage() {
  return (
    <div className="space-y-12">
      <section className="pt-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          Frequently asked questions
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          What LotStudio AI does, how vehicle integrity works, and how exports come back.
        </p>
      </section>

      <Group title="Product" items={PRODUCT} />
      <Group title="Vehicle integrity" items={INTEGRITY} />
      <Group title="Operations" items={OPERATIONS} />
    </div>
  );
}
