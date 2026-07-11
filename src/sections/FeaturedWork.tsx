export default function FeaturedWork() {
  return (
    <section
      id='featured'
      className='relative min-h-screen w-full bg-ink text-cream'
    >
      <div className='flex min-h-screen w-full items-center justify-center'>
        <h2
          className='font-display leading-none'
          style={{ fontSize: 'clamp(2.5rem, 9vw, 11rem)' }}
        >
          Featured Work
        </h2>
      </div>
    </section>
  )
}
