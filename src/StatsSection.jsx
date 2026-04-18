const stats = [
  {
    value: '10,000+ creators',
    description: 'Artists, educators, writers, and indie makers building sustainable support.',
  },
  {
    value: '\u20B950L+ earned',
    description: 'Meaningful support collected directly through fast and familiar UPI payments.',
  },
  {
    value: '100,000+ supporters',
    description: 'A growing community showing up with small gestures that add up quickly.',
  },
]

function StatsSection() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl rounded-[36px] border border-stone-200/70 bg-gradient-to-br from-stone-100 via-white to-amber-50 px-8 py-14 shadow-xl shadow-stone-200/60 sm:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Social Proof
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Trusted by creators and supporters alike
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <article
              key={stat.value}
              className="rounded-[28px] border border-white/80 bg-white/90 p-7 text-center shadow-md shadow-stone-200/50"
            >
              <p className="text-3xl font-semibold tracking-tight text-stone-950">
                {stat.value}
              </p>
              <p className="mt-3 text-base leading-7 text-stone-600">
                {stat.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
