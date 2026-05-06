import { SnowpawGame } from "@/components/snowpaw-game"

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#0a1929] via-[#1a3a5c] to-[#2d5a87] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-5xl flex flex-col gap-4">
        <header className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight text-balance">
            Snowpaw Hero
          </h1>
          <p className="text-sm md:text-base text-sky-200 text-pretty">
            Pygmy Possum Rescue &mdash; A conservation adventure in the Australian alps
          </p>
        </header>
        <SnowpawGame />
        <footer className="text-center text-xs text-sky-300/70 mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Space</kbd> or tap to jump.
          Collect 5 Bogong moths to unleash the Super Unicorn.
        </footer>
      </div>
    </main>
  )
}
