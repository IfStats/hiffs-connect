import Link from 'next/link';

import { MobileNav } from './mobile-nav';

function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3"
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/20">
        <span className="text-sm font-black tracking-[-0.08em]">
          HC
        </span>

        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      </div>

      <div>
        <div className="text-lg font-bold tracking-tight text-slate-950 transition group-hover:text-blue-600">
          Hiffs Connect
        </div>

        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          Business Messaging
        </div>
      </div>
    </Link>
  );
}

const features = [
  {
    title: 'Bulk SMS',
    description:
      'Reach thousands of customers with campaigns, alerts, promotions and transactional messaging.',
    icon: '↗',
  },
  {
    title: 'Contact Management',
    description:
      'Organize customer contacts, audiences and communication workflows in one place.',
    icon: '◎',
  },
  {
    title: 'API Integration',
    description:
      'Integrate messaging directly into your applications and business systems.',
    icon: '⚙',
  },
  {
    title: 'Detailed Reports',
    description:
      'Track delivery, message activity, provider performance and customer engagement.',
    icon: '▥',
  },
];

const benefits = [
  {
    title: 'Bulk SMS',
    text: 'Reach thousands instantly',
    icon: '✈',
  },
  {
    title: 'Reliable Delivery',
    text: 'High delivery success rate',
    icon: '◇',
  },
  {
    title: 'Global Coverage',
    text: 'Multiple providers and routes',
    icon: '◎',
  },
  {
    title: 'Affordable Pricing',
    text: 'Pay only for what you use',
    icon: '▥',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="relative sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <Link
              href="/"
              className="text-blue-600"
            >
              Home
            </Link>

            <a
              href="#features"
              className="transition hover:text-slate-950"
            >
              Features
            </a>

            <a
              href="#pricing"
              className="transition hover:text-slate-950"
            >
              Pricing
            </a>

            <a
              href="#solutions"
              className="transition hover:text-slate-950"
            >
              Solutions
            </a>

            <a
              href="#developers"
              className="transition hover:text-slate-950"
            >
              Resources
            </a>

            <a
              href="#contact"
              className="transition hover:text-slate-950"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
  <div className="hidden items-center gap-3 lg:flex">
    <Link
      href="/login"
      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
    >
      Sign In
    </Link>

    <Link
      href="/signup"
      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
    >
      Get Started
    </Link>
  </div>

  <MobileNav />
</div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-blue-50/50 to-white">
        <div className="absolute right-0 top-0 h-[620px] w-[48%] -skew-x-12 bg-gradient-to-br from-blue-600 to-blue-400 opacity-95" />

        <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1fr_1.15fr] lg:px-8">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              RELIABLE • FAST • GLOBAL
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-[68px] lg:leading-[1.03]">
              Power Your Business with{' '}
              <span className="text-blue-600">
                Reliable Messaging
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Send SMS at scale, engage your customers,
              and grow your business with Hiffs Connect.
              Simple, secure, and built for businesses
              across Africa and beyond.
            </p>

            <div className="mt-8 grid max-w-2xl gap-5 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                    {benefit.icon}
                  </div>

                  <div>
                    <div className="font-semibold">
                      {benefit.title}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {benefit.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Get Started
                <span>→</span>
              </Link>

              <a
                href="#contact"
                className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Talk to Sales
              </a>
            </div>
          </div>

          <div className="relative z-10">
            <div className="rotate-[-1deg] rounded-[28px] border border-white/60 bg-white/95 p-3 shadow-2xl shadow-slate-900/20 backdrop-blur">
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                <div className="grid min-h-[430px] grid-cols-[155px_1fr]">
                  <aside className="bg-slate-950 p-5 text-white">
                    <div className="mb-8 font-bold">
                      Hiffs Connect
                    </div>

                    <div className="space-y-3 text-xs text-slate-300">
                      {[
                        'Dashboard',
                        'Messages',
                        'Send SMS',
                        'Contacts',
                        'Senders',
                        'API Keys',
                        'Wallet & Billing',
                        'Reports',
                        'Settings',
                      ].map((item, index) => (
                        <div
                          key={item}
                          className={
                            index === 0
                              ? 'rounded-lg bg-blue-600 px-3 py-2 text-white'
                              : 'px-3 py-2'
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold">
                          Dashboard
                        </div>

                        <div className="text-xs text-slate-500">
                          Overview of your messaging activity.
                        </div>
                      </div>

                      <div className="rounded-lg border bg-white px-3 py-2 text-xs">
                        Last 30 days
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-4 gap-3">
                      {[
                        ['1,250', 'Messages Sent'],
                        ['98.5%', 'Delivery Rate'],
                        ['12', 'Active Senders'],
                        ['GHS 245.50', 'Wallet Balance'],
                      ].map(([value, label]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="text-lg font-bold">
                            {value}
                          </div>

                          <div className="mt-1 text-[11px] text-slate-500">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-[1.5fr_0.8fr] gap-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="text-sm font-semibold">
                          Message Activity
                        </div>

                        <div className="mt-8 flex h-40 items-end gap-2">
                          {[34, 46, 40, 62, 55, 70, 64, 82, 76, 90, 88, 104].map(
                            (height, index) => (
                              <div
                                key={index}
                                className="flex-1 rounded-t bg-blue-500/80"
                                style={{
                                  height: `${height}px`,
                                }}
                              />
                            ),
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <div className="text-sm font-semibold">
                          Delivery Status
                        </div>

                        <div className="mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full border-[14px] border-emerald-500">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">
                              98.5%
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Delivered
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="solutions"
        className="border-b border-slate-100 bg-slate-50"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-6 py-7 text-sm font-medium text-slate-500">
          <span>Retail</span>
          <span>Financial Services</span>
          <span>Education</span>
          <span>Healthcare</span>
          <span>Hospitality</span>
          <span>Logistics</span>
          <span>and more</span>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Everything You Need for Business Messaging
          </h2>

          <p className="mt-4 text-lg text-slate-500">
            Powerful tools to help you communicate,
            engage and grow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-600">
                {feature.icon}
              </div>

              <h3 className="mt-5 text-lg font-bold">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-blue-50/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.4fr] lg:px-8">
          <div>
            <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold tracking-wider text-blue-600">
              HOW IT WORKS
            </div>

            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Get Started in 3 Simple Steps
            </h2>

            <p className="mt-4 text-slate-600">
              Start sending business messages in minutes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              [
                '1',
                'Create Your Account',
                'Sign up and create your business workspace.',
              ],
              [
                '2',
                'Add Credit',
                'Fund your wallet and configure your messaging account.',
              ],
              [
                '3',
                'Start Sending',
                'Send messages and track delivery in real time.',
              ],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="relative"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {number}
                </div>

                <h3 className="mt-5 font-bold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="developers"
        className="bg-slate-950"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 text-white lg:grid-cols-2 lg:px-8">
          <div>
            <div className="text-sm font-semibold text-blue-400">
              BUILT FOR DEVELOPERS
            </div>

            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Integrate messaging into any application.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-slate-400">
              Use Hiffs Connect APIs to send transactional
              SMS, notifications, verification messages and
              customer communications from your own systems.
            </p>

            <Link
              href="/dashboard/developers/docs"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
            >
              Explore the API
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 font-mono text-sm text-slate-300">
            <div className="text-slate-500">
              POST /messaging/sms
            </div>

            <pre className="mt-6 overflow-x-auto whitespace-pre-wrap">
{`{
  "to": "+233XXXXXXXXX",
  "senderRegistrationId": "sender_xxx",
  "text": "Your order has been confirmed."
}`}
            </pre>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >
        <div className="rounded-[32px] bg-gradient-to-br from-blue-600 to-blue-500 px-8 py-16 text-center text-white shadow-2xl shadow-blue-600/20 lg:px-16">
          <h2 className="text-4xl font-bold tracking-tight">
            Ready to connect with your customers?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-blue-100">
            Create your Hiffs Connect account and start
            building reliable customer communication today.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-600"
            >
              Get Started
            </Link>

            <a
              href="#contact"
              className="rounded-xl border border-white/30 px-7 py-3.5 font-semibold"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="border-t border-slate-200 bg-slate-50"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <Logo />

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
              Reliable business messaging infrastructure
              for growing companies across Africa.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Product
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <div>SMS Messaging</div>
              <div>API Integration</div>
              <div>Sender Management</div>
              <div>Reporting</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">
              Contact
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <div>hello@hiffsglobal.com</div>
              <div>Accra, Ghana</div>
              <div>Hiffs Global Enterprises</div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 py-6 text-center text-sm text-slate-400">
          © 2026 Hiffs Global Enterprises. All rights reserved.
        </div>
      </footer>
    </main>
  );
}