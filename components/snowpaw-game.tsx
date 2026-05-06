"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { drawSnowpaw, drawMoth, drawEnemy, drawObstacle, drawSnowflake, drawMountain } from "@/lib/sprites"

const GAME_WIDTH = 900
const GAME_HEIGHT = 450
const GROUND_Y = 370
const GRAVITY = 0.7
const JUMP_VELOCITY = -13
const UNICORN_JUMP_VELOCITY = -17
const PLAYER_X = 140
const PLAYER_W = 56
const PLAYER_H = 50
const BASE_SPEED = 5

const FACTS = [
  "Only ~2,000 Mountain Pygmy-possums remain in the wild!",
  "They are Australia's only hibernating marsupial.",
  "Bogong moths are vital for their spring diet.",
  "Climate change threatens their tiny alpine habitat.",
  "They were thought extinct until rediscovered in 1966!",
]

type GameState = "menu" | "playing" | "gameover"

interface Entity {
  id: number
  x: number
  y: number
  w: number
  h: number
  variant: number
  bob: number
}

interface Snowflake {
  x: number
  y: number
  size: number
  speed: number
  drift: number
}

interface FloatText {
  id: number
  x: number
  y: number
  text: string
  life: number
}

export function SnowpawGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [gameState, setGameState] = useState<GameState>("menu")
  const [score, setScore] = useState(0)
  const [mothCount, setMothCount] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [unicorn, setUnicorn] = useState(false)
  const [fact, setFact] = useState<string | null>(null)

  // Mutable game refs
  const stateRef = useRef({
    player: { x: PLAYER_X, y: GROUND_Y - PLAYER_H, vy: 0, isJumping: false, runFrame: 0 },
    moths: [] as Entity[],
    enemies: [] as Entity[],
    obstacles: [] as Entity[],
    snowflakes: [] as Snowflake[],
    floatTexts: [] as FloatText[],
    bgScroll: 0,
    farScroll: 0,
    speed: BASE_SPEED,
    score: 0,
    mothCount: 0,
    unicornUntil: 0,
    nextMothAt: 0,
    nextEnemyAt: 0,
    nextObstacleAt: 0,
    lastTime: 0,
    nextId: 1,
    running: false,
    factTimeoutId: 0 as unknown as ReturnType<typeof setTimeout> | null,
  })

  const resetGame = useCallback(() => {
    const s = stateRef.current
    s.player = { x: PLAYER_X, y: GROUND_Y - PLAYER_H, vy: 0, isJumping: false, runFrame: 0 }
    s.moths = []
    s.enemies = []
    s.obstacles = []
    s.floatTexts = []
    s.bgScroll = 0
    s.farScroll = 0
    s.speed = BASE_SPEED
    s.score = 0
    s.mothCount = 0
    s.unicornUntil = 0
    s.nextMothAt = performance.now() + 1500
    s.nextEnemyAt = performance.now() + 2200
    s.nextObstacleAt = performance.now() + 3000
    // seed snowflakes
    s.snowflakes = Array.from({ length: 60 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: 1 + Math.random() * 2.5,
      speed: 0.4 + Math.random() * 1.2,
      drift: -0.5 + Math.random() * 1,
    }))
    setScore(0)
    setMothCount(0)
    setUnicorn(false)
    setFact(null)
  }, [])

  const startGame = useCallback(() => {
    resetGame()
    stateRef.current.running = true
    setGameState("playing")
  }, [resetGame])

  const jump = useCallback(() => {
    const s = stateRef.current
    if (gameState === "menu") {
      startGame()
      return
    }
    if (gameState === "gameover") {
      startGame()
      return
    }
    if (!s.player.isJumping) {
      const isUni = performance.now() < s.unicornUntil
      s.player.vy = isUni ? UNICORN_JUMP_VELOCITY : JUMP_VELOCITY
      s.player.isJumping = true
    }
  }, [gameState, startGame])

  // Input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault()
        jump()
      }
    }
    const onPointer = (e: PointerEvent) => {
      // Only treat taps directly on the canvas as jumps, so clicks on
      // overlay buttons (Start / Run Again) are not double-handled.
      if (e.target === canvasRef.current) {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer)
    }
  }, [jump])

  // Load high score
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("snowpaw_high")
      if (stored) setHighScore(parseInt(stored, 10) || 0)
    } catch {}
  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    const s = stateRef.current

    const spawn = (now: number) => {
      if (gameState !== "playing") return

      if (now >= s.nextMothAt) {
        s.moths.push({
          id: s.nextId++,
          x: GAME_WIDTH + 30,
          y: GROUND_Y - 80 - Math.random() * 140,
          w: 32,
          h: 26,
          variant: 0,
          bob: Math.random() * Math.PI * 2,
        })
        s.nextMothAt = now + 1400 + Math.random() * 1800
      }

      if (now >= s.nextEnemyAt) {
        s.enemies.push({
          id: s.nextId++,
          x: GAME_WIDTH + 30,
          y: GROUND_Y - 42,
          w: 50,
          h: 42,
          variant: Math.floor(Math.random() * 3), // 0=turtle 1=kangaroo 2=dropbear
          bob: 0,
        })
        s.nextEnemyAt = now + 1800 + Math.random() * 1800
      }

      if (now >= s.nextObstacleAt) {
        const variant = Math.floor(Math.random() * 3) // 0=building 1=scaffold 2=skiLift
        const heights = [80, 96, 110]
        s.obstacles.push({
          id: s.nextId++,
          x: GAME_WIDTH + 30,
          y: GROUND_Y - heights[variant],
          w: 64,
          h: heights[variant],
          variant,
          bob: 0,
        })
        s.nextObstacleAt = now + 2200 + Math.random() * 2200
      }
    }

    const aabb = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => {
      // Tighter hitbox for fairness
      const pad = 6
      return (
        a.x + pad < b.x + b.w - pad &&
        a.x + a.w - pad > b.x + pad &&
        a.y + pad < b.y + b.h - pad &&
        a.y + a.h - pad > b.y + pad
      )
    }

    const triggerGameOver = () => {
      s.running = false
      setGameState("gameover")
      setHighScore((prev) => {
        const next = Math.max(prev, s.score)
        try {
          sessionStorage.setItem("snowpaw_high", String(next))
        } catch {}
        return next
      })
    }

    const triggerUnicorn = () => {
      s.unicornUntil = performance.now() + 5000
      setUnicorn(true)
      const f = FACTS[Math.floor(Math.random() * FACTS.length)]
      setFact(f)
      if (s.factTimeoutId) clearTimeout(s.factTimeoutId)
      s.factTimeoutId = setTimeout(() => setFact(null), 4500)
    }

    const update = (dt: number, now: number) => {
      if (gameState !== "playing") return

      // Difficulty ramp
      s.speed = BASE_SPEED + Math.min(5, s.score / 60)

      // Player physics
      const p = s.player
      p.vy += GRAVITY
      p.y += p.vy
      if (p.y >= GROUND_Y - PLAYER_H) {
        p.y = GROUND_Y - PLAYER_H
        p.vy = 0
        p.isJumping = false
      }
      p.runFrame += dt * 0.012

      // Scroll background
      s.bgScroll = (s.bgScroll + s.speed) % GAME_WIDTH
      s.farScroll = (s.farScroll + s.speed * 0.3) % GAME_WIDTH

      // Snowflakes
      for (const sf of s.snowflakes) {
        sf.y += sf.speed
        sf.x += sf.drift - s.speed * 0.15
        if (sf.y > GAME_HEIGHT) {
          sf.y = -4
          sf.x = Math.random() * GAME_WIDTH
        }
        if (sf.x < -4) sf.x = GAME_WIDTH + 4
      }

      const isUni = now < s.unicornUntil
      setUnicorn((prev) => (prev !== isUni ? isUni : prev))

      // Move + cull entities
      const moveAndCull = (arr: Entity[]) => {
        for (let i = arr.length - 1; i >= 0; i--) {
          arr[i].x -= s.speed
          arr[i].bob += dt * 0.005
          if (arr[i].x + arr[i].w < -10) arr.splice(i, 1)
        }
      }
      moveAndCull(s.moths)
      moveAndCull(s.enemies)
      moveAndCull(s.obstacles)

      // Float texts
      for (let i = s.floatTexts.length - 1; i >= 0; i--) {
        s.floatTexts[i].life -= dt
        s.floatTexts[i].y -= 0.5
        s.floatTexts[i].x -= s.speed
        if (s.floatTexts[i].life <= 0) s.floatTexts.splice(i, 1)
      }

      // Collisions
      const playerBox = { x: p.x, y: p.y, w: PLAYER_W, h: PLAYER_H }

      // Moths
      for (let i = s.moths.length - 1; i >= 0; i--) {
        const m = s.moths[i]
        const mBox = { x: m.x, y: m.y + Math.sin(m.bob * 1.5) * 6, w: m.w, h: m.h }
        if (aabb(playerBox, mBox)) {
          s.moths.splice(i, 1)
          s.score += 1
          s.mothCount += 1
          setScore(s.score)
          s.floatTexts.push({ id: s.nextId++, x: mBox.x, y: mBox.y, text: "+1", life: 700 })
          if (s.mothCount >= 5) {
            s.mothCount = 0
            triggerUnicorn()
          }
          setMothCount(s.mothCount)
        }
      }

      // Enemies
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i]
        if (aabb(playerBox, e)) {
          if (isUni) {
            s.enemies.splice(i, 1)
            s.score += 2
            setScore(s.score)
            s.floatTexts.push({ id: s.nextId++, x: e.x, y: e.y, text: "+2", life: 700 })
          } else {
            triggerGameOver()
            return
          }
        }
      }

      // Obstacles
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        const o = s.obstacles[i]
        if (aabb(playerBox, o)) {
          if (isUni) {
            s.obstacles.splice(i, 1)
            s.score += 3
            setScore(s.score)
            s.floatTexts.push({ id: s.nextId++, x: o.x, y: o.y, text: "+3", life: 700 })
          } else {
            triggerGameOver()
            return
          }
        }
      }

      // Passive distance score (1 per second)
      s.score += dt * 0.01
      const intScore = Math.floor(s.score)
      setScore((prev) => (prev !== intScore ? intScore : prev))
    }

    const drawBackground = () => {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
      sky.addColorStop(0, "#1a3a5c")
      sky.addColorStop(0.6, "#5a8fb8")
      sky.addColorStop(1, "#a8c8e0")
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // Far mountains (parallax)
      ctx.save()
      ctx.translate(-s.farScroll, 0)
      drawMountain(ctx, 0, GROUND_Y - 50, GAME_WIDTH * 2, 140, "#3d5e7a")
      ctx.restore()

      // Mid mountains
      ctx.save()
      ctx.translate(-s.bgScroll * 0.6, 0)
      drawMountain(ctx, 0, GROUND_Y - 30, GAME_WIDTH * 2, 100, "#5a7a96")
      ctx.restore()

      // Snowflakes
      for (const sf of s.snowflakes) {
        drawSnowflake(ctx, sf.x, sf.y, sf.size)
      }
    }

    const drawGround = () => {
      // Snowy ground
      ctx.fillStyle = "#e8f0f7"
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y)
      // Shadow line
      ctx.fillStyle = "#c8d8e8"
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 4)

      // Boulders pattern (scrolling)
      ctx.save()
      ctx.translate(-s.bgScroll, 0)
      for (let x = 0; x < GAME_WIDTH * 2; x += 80) {
        const r = 6 + ((x * 13) % 8)
        ctx.fillStyle = "#b8c8d8"
        ctx.beginPath()
        ctx.arc(x, GROUND_Y + 14, r, Math.PI, 0)
        ctx.fill()
        ctx.fillStyle = "#a0b4c8"
        ctx.fillRect(x - r, GROUND_Y + 14, r * 2, 2)
      }
      ctx.restore()
    }

    const drawHUD = () => {
      // Power-up bar (drawn inside canvas at top right)
      if (s.unicornUntil > performance.now()) {
        const remaining = (s.unicornUntil - performance.now()) / 5000
        const barW = 160
        const barH = 8
        const barX = GAME_WIDTH - barW - 16
        const barY = 16
        ctx.fillStyle = "rgba(0,0,0,0.3)"
        ctx.fillRect(barX, barY, barW, barH)
        const grd = ctx.createLinearGradient(barX, 0, barX + barW, 0)
        grd.addColorStop(0, "#ff6b9d")
        grd.addColorStop(0.5, "#ffd93d")
        grd.addColorStop(1, "#6bcfff")
        ctx.fillStyle = grd
        ctx.fillRect(barX, barY, barW * remaining, barH)
        ctx.fillStyle = "#fff"
        ctx.font = "bold 11px system-ui, sans-serif"
        ctx.textAlign = "right"
        ctx.fillText("UNICORN MODE", barX + barW, barY - 4)
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      drawBackground()
      drawGround()

      // Obstacles (draw first so enemies appear in front)
      for (const o of s.obstacles) {
        drawObstacle(ctx, o.x, o.y, o.w, o.h, o.variant)
      }

      // Moths
      for (const m of s.moths) {
        const yo = Math.sin(m.bob * 1.5) * 6
        drawMoth(ctx, m.x, m.y + yo, m.w, m.h, m.bob)
      }

      // Enemies
      for (const e of s.enemies) {
        drawEnemy(ctx, e.x, e.y, e.w, e.h, e.variant, e.bob)
      }

      // Player
      const isUni = performance.now() < s.unicornUntil
      drawSnowpaw(ctx, s.player.x, s.player.y, PLAYER_W, PLAYER_H, s.player.runFrame, s.player.isJumping, isUni)

      // Float texts
      for (const ft of s.floatTexts) {
        ctx.fillStyle = "#ffd93d"
        ctx.font = "bold 18px system-ui, sans-serif"
        ctx.textAlign = "center"
        ctx.lineWidth = 3
        ctx.strokeStyle = "rgba(0,0,0,0.5)"
        ctx.strokeText(ft.text, ft.x, ft.y)
        ctx.fillText(ft.text, ft.x, ft.y)
      }

      drawHUD()
    }

    const tick = (now: number) => {
      const dt = s.lastTime ? Math.min(50, now - s.lastTime) : 16
      s.lastTime = now
      spawn(now)
      update(dt, now)
      render()
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [gameState])

  // Responsive scaling
  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return
    const resize = () => {
      const w = wrapper.clientWidth
      const scale = w / GAME_WIDTH
      canvas.style.width = `${w}px`
      canvas.style.height = `${GAME_HEIGHT * scale}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-[#1a3a5c] select-none touch-none">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="block w-full h-auto cursor-pointer"
        aria-label="Snowpaw Hero game canvas"
      />

      {/* HUD overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <div className="flex items-start justify-between p-3 md:p-4 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white">
              <div className="text-[10px] uppercase tracking-wider text-sky-200">Score</div>
              <div className="font-mono text-lg md:text-xl font-bold leading-none">{score}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white">
              <div className="text-[10px] uppercase tracking-wider text-sky-200">Best</div>
              <div className="font-mono text-lg md:text-xl font-bold leading-none">{highScore}</div>
            </div>
          </div>

          {/* Moth progress */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <div className="text-[10px] uppercase tracking-wider text-sky-200 text-right">Moths</div>
            <div className="flex gap-1 mt-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all ${
                    i < mothCount
                      ? "bg-amber-300 shadow-[0_0_8px_rgba(255,217,61,0.8)]"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Fact bubble */}
        {fact && (
          <div className="pointer-events-none flex justify-center mt-2 px-4">
            <div className="animate-slide-down bg-white/95 backdrop-blur rounded-2xl px-4 py-3 max-w-md shadow-xl border-2 border-amber-300 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-300 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Did you know?
              </div>
              <p className="text-sm text-slate-800 text-pretty text-center mt-1">{fact}</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu overlay */}
      {gameState === "menu" && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1929]/80 via-[#1a3a5c]/70 to-[#2d5a87]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
          <div className="bg-white/95 rounded-2xl p-6 md:p-8 max-w-md shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Save the Pygmy-possum</h2>
            <p className="text-sm md:text-base text-slate-600 mb-5 text-pretty">
              Dodge construction in the alps, snatch Bogong moths, and unleash the Super Unicorn every 5 moths to dash through anything.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-5 text-xs">
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                <div className="font-bold text-amber-700">Moth</div>
                <div className="text-amber-900">+1 point</div>
              </div>
              <div className="bg-rose-50 rounded-lg p-2 border border-rose-200">
                <div className="font-bold text-rose-700">Hazard</div>
                <div className="text-rose-900">Avoid!</div>
              </div>
              <div className="bg-sky-50 rounded-lg p-2 border border-sky-200">
                <div className="font-bold text-sky-700">5 Moths</div>
                <div className="text-sky-900">Unicorn!</div>
              </div>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 transition-colors text-white font-bold py-3 rounded-xl shadow-lg"
            >
              Start Run
            </button>
            <p className="text-xs text-slate-500 mt-3">Space / Tap to jump</p>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1929]/80 via-[#1a3a5c]/80 to-[#2d5a87]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
          <div className="bg-white/95 rounded-2xl p-6 md:p-8 max-w-md shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">Snowpaw is down!</h2>
            <p className="text-sm text-slate-600 mb-5">
              The alps are losing another little hero. Try again?
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Final Score</div>
                <div className="font-mono text-2xl font-bold text-slate-900">{score}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-amber-700">Best</div>
                <div className="font-mono text-2xl font-bold text-amber-900">{highScore}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={startGame}
              className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 transition-colors text-white font-bold py-3 rounded-xl shadow-lg"
            >
              Run Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
