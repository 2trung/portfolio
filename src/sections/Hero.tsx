interface HeroProps {
  revealed: boolean
}

export default function Hero({ revealed }: HeroProps) {
  return (
    <section
      className={`relative flex min-h-screen w-full items-center justify-center bg-cream transition-opacity duration-700 ease-out ${revealed ? 'opacity-100' : 'opacity-0'
        }`}
    />
  )
}
