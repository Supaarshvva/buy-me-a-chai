const supporterMessages = [
  {
    name: 'Aarav',
    message: 'Your illustrations made my morning. Sending chai for the next one.',
  },
  {
    name: 'Neha',
    message: 'Loved the latest reel breakdown. Clear, helpful, and full of heart.',
  },
  {
    name: 'Ritika',
    message: 'Rooting for your next workshop. Keep creating, we are watching.',
  },
]

function Hero() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-10">
      <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm">
            Built for creators across India
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
            Fund your creative work with a little{' '}
            <span className="text-amber-600">chai {'\u2615'}</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-stone-600 sm:text-xl">
            A simple, Indian-first platform for creators to receive support via
            UPI.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <button className="w-full rounded-full bg-stone-900 px-6 py-3 text-base font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-300/40 sm:w-auto">
              Start your page
            </button>
            <a
              href="#"
              className="text-base font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition hover:text-amber-700 hover:decoration-amber-400"
            >
              Explore creators
            </a>
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-amber-900/10 backdrop-blur sm:p-8">
            <div className="rounded-[28px] bg-gradient-to-br from-amber-100 via-orange-50 to-white p-6 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900 text-lg font-semibold text-white shadow-lg shadow-stone-900/20">
                  AK
                </div>
                <div>
                  <p className="text-xl font-semibold text-stone-950">
                    Aisha Kapoor
                  </p>
                  <p className="text-sm text-stone-500">
                    Illustrator and visual storyteller
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full rounded-2xl bg-amber-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-amber-400/40 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-xl">
                Buy me a chai {'\u2615'}
              </button>

              <div className="mt-6 space-y-3">
                {supporterMessages.map((support) => (
                  <article
                    key={support.name}
                    className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="text-sm font-semibold text-stone-800">
                      {support.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      {support.message}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Hero
