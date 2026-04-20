const reasons = [
  {
    icon: '\u26A1',
    title: 'Instant UPI Payments',
    description: 'Supporters pay through UPI — the fastest, most familiar way to pay in India.',
  },
  {
    icon: '\u20B9',
    title: 'Money goes straight to you',
    description: 'No middleman, no payout cycles. Your supporters pay you directly, every time.',
  },
  {
    icon: '\u2728',
    title: 'Made for Indian creators',
    description: 'Whether you write, draw, teach, or build — this platform is designed for you.',
  },
]

function WhySection() {
  return (
    <section className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Why Buy Me a Chai?
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            A simple way for creators to get support
          </h2>
          <p className="mt-4 text-lg leading-8 text-stone-600">
            No sign-up for supporters. No fees. Just UPI and genuine appreciation.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reasons.map((reason) => (
            <article
              key={reason.title}
              className="group rounded-[28px] border border-white/80 bg-white/90 p-7 shadow-lg shadow-stone-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-200/40"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-sm transition duration-300 group-hover:bg-amber-500 group-hover:text-white">
                {reason.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-stone-950">
                {reason.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-stone-600">
                {reason.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhySection
