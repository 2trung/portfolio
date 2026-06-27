interface HeroProps {
  revealed: boolean
}

export default function Hero({ revealed }: HeroProps) {
  return (
    <section
      className={`relative min-h-screen w-full bg-cream px-8 py-24 transition-opacity duration-700 ease-out ${revealed ? 'opacity-100' : 'opacity-0'
        }`}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-16">
        {/* ---- Aeonik (display) -------------------------------------- */}
        <div className="flex flex-col gap-4">
          <span className="font-sans text-sm uppercase tracking-widest text-gray">
            Aeonik · display
          </span>
          <h1 className="font-display text-7xl font-bold leading-none text-ink">
            Design that moves.
          </h1>
          <p className="font-display text-2xl font-medium text-ink">
            Medium 500 — The quick brown fox jumps over the lazy dog.
          </p>
          <p className="font-display text-2xl font-normal text-ink">
            Regular 400 — The quick brown fox jumps over the lazy dog.
          </p>
        </div>

        {/* ---- Sohne (body) ----------------------------------------- */}
        <div className="flex flex-col gap-4">
          <span className="font-sans text-sm uppercase tracking-widest text-gray">
            Sohne · body
          </span>
          <p className="font-sans text-lg font-bold text-ink">
            Bold 700 — The quick brown fox jumps over the lazy dog. 0123456789
          </p>
          <p className="font-sans text-lg font-medium text-ink">
            Medium 500 — The quick brown fox jumps over the lazy dog. 0123456789
          </p>
          <p className="font-sans text-lg font-normal text-ink">
            Regular 400 — The quick brown fox jumps over the lazy dog. 0123456789
          </p>
          <p className="font-sans text-base font-normal leading-relaxed text-gray">
            A paragraph in Sohne Regular to check body copy rhythm. Typography is
            what language looks like — the weight contrast between Aeonik display
            and Sohne text is what carries the awwwards feel.
          </p>
        </div>
      </div>
    </section>
  )
}
