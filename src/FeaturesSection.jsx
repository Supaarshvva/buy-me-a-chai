const features = [
  {
    icon: '\u{1F4B8}',
    title: 'Accept Donations',
    description: 'Let supporters contribute in seconds with a simple, familiar flow.',
  },
  {
    icon: '\u{1F4E6}',
    title: 'Sell Digital Products',
    description: 'Offer templates, guides, and downloads from the same creator page.',
  },
  {
    icon: '\u{1F4F0}',
    title: 'Post Content',
    description: 'Share updates, behind-the-scenes notes, and exclusive posts with ease.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Track Earnings',
    description: 'Understand what is working with a clear view of support and growth.',
  },
]

function FeaturesSection() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Everything you need to grow
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-[28px] border border-stone-200/70 bg-white/80 p-7 text-center shadow-md shadow-stone-200/40 transition duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-200/30"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-2xl text-white shadow-lg shadow-stone-900/15 transition duration-300 group-hover:bg-amber-500">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-stone-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-stone-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
