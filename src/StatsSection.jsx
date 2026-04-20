const trustPoints = [
  {
    icon: '\u{1F1EE}\u{1F1F3}',
    title: 'Built for Indian creators',
    description: 'Designed around UPI, the payment system your audience already uses daily.',
  },
  {
    icon: '\u26A1',
    title: 'No platform fees, no delays',
    description: 'Supporters pay you directly. Your money reaches you instantly — every single time.',
  },
  {
    icon: '\u{1F91D}',
    title: 'Simple, direct support',
    description: 'No subscriptions, no tiers, no complexity. Just a page, a chai, and genuine support.',
  },
]

function StatsSection() {
  return (
    <section className="px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[36px] border border-stone-200/70 bg-gradient-to-br from-stone-100 via-white to-amber-50 px-8 py-14 shadow-xl shadow-stone-200/60 sm:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Why creators trust us
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Honest tools for honest work
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {trustPoints.map((point) => (
            <article
              key={point.title}
              className="group rounded-[28px] border border-white/80 bg-white/90 p-7 text-center shadow-md shadow-stone-200/50 transition duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-200/30"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-sm transition duration-300 group-hover:bg-amber-500 group-hover:text-white">
                {point.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-stone-950">
                {point.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-stone-600">
                {point.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
