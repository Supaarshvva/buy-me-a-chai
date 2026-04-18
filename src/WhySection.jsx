const reasons = [
  {
    icon: '\u26A1',
    title: 'Instant UPI Payments',
    description: 'Receive support directly via UPI with zero friction.',
  },
  {
    icon: '\u20B9',
    title: 'No waiting for payouts',
    description: 'Get your money instantly, no delays like other platforms.',
  },
  {
    icon: '\u2728',
    title: 'Creator-first platform',
    description: 'Designed specifically for Indian creators and freelancers.',
  },
]

function WhySection() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Why Buy Me a Chai?
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Built for creators in India
          </h2>
          <p className="mt-4 text-lg leading-8 text-stone-600">
            Everything you need to receive support, powered by UPI
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
