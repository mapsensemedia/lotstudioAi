import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'LotStudio AI',
  description:
    'Showroom-ready photos for your inventory — replace the background, keep the vehicle.',
};

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'How it works', href: '#' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '#' },
      { label: 'Best practices', href: '#' },
      { label: 'API docs', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'DPA', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-6">
              <Link href="/" className="font-semibold text-lg tracking-tight shrink-0">
                LotStudio<span className="text-indigo-600"> AI</span>
              </Link>
              <nav className="hidden md:flex items-center gap-7 text-sm text-slate-700">
                {NAV_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="hover:text-indigo-600">
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/erase"
                  className="hidden sm:inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                >
                  Magic Eraser
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
                >
                  Open dashboard
                </Link>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <footer className="mt-16 border-t border-slate-200 bg-slate-50 text-slate-700">
            <div className="mx-auto max-w-6xl px-6 py-12">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                <div className="col-span-2 md:col-span-1">
                  <Link href="/" className="font-semibold text-base tracking-tight">
                    LotStudio<span className="text-indigo-600"> AI</span>
                  </Link>
                  <p className="mt-3 text-xs text-slate-500 max-w-[14rem]">
                    Studio backgrounds for dealership inventory photos. Vehicle pixels stay
                    untouched.
                  </p>
                </div>
                {FOOTER_COLS.map((col) => (
                  <div key={col.title}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                      {col.title}
                    </div>
                    <ul className="mt-3 space-y-2 text-sm">
                      {col.links.map((l) => (
                        <li key={l.label}>
                          <Link href={l.href} className="text-slate-600 hover:text-indigo-600">
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <div>© {year} LotStudio AI. All rights reserved.</div>
                <div>Built for car dealerships.</div>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
