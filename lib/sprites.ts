// Canvas sprite drawing helpers.
// All sprites are drawn with primitive shapes for performance and a
// cohesive, illustrated look.

type Ctx = CanvasRenderingContext2D

// ---------- Snowpaw the Mountain Pygmy-possum ----------
export function drawSnowpaw(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  runFrame: number,
  isJumping: boolean,
  isUnicorn: boolean,
) {
  ctx.save()
  ctx.translate(x, y)

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)"
  ctx.beginPath()
  ctx.ellipse(w / 2, h + 4, w * 0.45, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Unicorn aura
  if (isUnicorn) {
    const t = performance.now() / 200
    const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.9)
    grad.addColorStop(0, "rgba(255, 217, 61, 0.5)")
    grad.addColorStop(0.5, "rgba(255, 107, 157, 0.3)")
    grad.addColorStop(1, "rgba(107, 207, 255, 0)")
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, w * 0.9 + Math.sin(t) * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Tail (long, pre-hensile)
  ctx.fillStyle = isUnicorn ? "#f4d4e8" : "#9b8474"
  const tailWag = Math.sin(runFrame * 6) * 4
  ctx.beginPath()
  ctx.moveTo(w * 0.15, h * 0.55)
  ctx.quadraticCurveTo(-w * 0.1, h * 0.35 + tailWag, -w * 0.15, h * 0.7 + tailWag)
  ctx.quadraticCurveTo(-w * 0.05, h * 0.5 + tailWag, w * 0.2, h * 0.7)
  ctx.fill()

  // Body
  const bodyColor = isUnicorn ? "#f8e6f0" : "#b69d8a"
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.ellipse(w * 0.55, h * 0.6, w * 0.4, h * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()

  // Belly
  ctx.fillStyle = isUnicorn ? "#fff5fa" : "#e8dcc8"
  ctx.beginPath()
  ctx.ellipse(w * 0.55, h * 0.72, w * 0.28, h * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs (running animation)
  const legSwing = isJumping ? 0.3 : Math.sin(runFrame * 8) * 0.4
  ctx.fillStyle = isUnicorn ? "#e8c8d8" : "#8a7560"
  // Back leg
  ctx.fillRect(w * 0.35, h * 0.78, 8, 12 + (isJumping ? 0 : Math.sin(runFrame * 8) * 2))
  // Front leg
  ctx.save()
  ctx.translate(w * 0.7, h * 0.78)
  ctx.rotate(legSwing)
  ctx.fillRect(-4, 0, 8, 12)
  ctx.restore()

  // Head
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.arc(w * 0.82, h * 0.45, h * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Snout
  ctx.fillStyle = isUnicorn ? "#fff5fa" : "#d4c2ad"
  ctx.beginPath()
  ctx.ellipse(w * 0.95, h * 0.55, h * 0.12, h * 0.09, 0, 0, Math.PI * 2)
  ctx.fill()

  // Pink nose
  ctx.fillStyle = "#ff6b8a"
  ctx.beginPath()
  ctx.arc(w * 1.02, h * 0.53, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = "#1a1a1a"
  ctx.beginPath()
  ctx.arc(w * 0.85, h * 0.42, 3.5, 0, Math.PI * 2)
  ctx.fill()
  // Eye highlight
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.arc(w * 0.86, h * 0.41, 1.2, 0, Math.PI * 2)
  ctx.fill()

  // Ears
  ctx.fillStyle = bodyColor
  ctx.beginPath()
  ctx.ellipse(w * 0.72, h * 0.25, 5, 7, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.86, h * 0.22, 5, 7, 0.1, 0, Math.PI * 2)
  ctx.fill()
  // Inner ear pink
  ctx.fillStyle = "#ff9bb3"
  ctx.beginPath()
  ctx.ellipse(w * 0.72, h * 0.27, 2.5, 4, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.86, h * 0.24, 2.5, 4, 0.1, 0, Math.PI * 2)
  ctx.fill()

  // Unicorn extras: horn + rainbow mane + sparkles
  if (isUnicorn) {
    // Horn
    const horn = ctx.createLinearGradient(w * 0.85, h * 0.05, w * 0.85, h * 0.25)
    horn.addColorStop(0, "#fff5a0")
    horn.addColorStop(1, "#ffd93d")
    ctx.fillStyle = horn
    ctx.beginPath()
    ctx.moveTo(w * 0.78, h * 0.22)
    ctx.lineTo(w * 0.85, h * -0.05)
    ctx.lineTo(w * 0.92, h * 0.22)
    ctx.closePath()
    ctx.fill()
    // Spiral
    ctx.strokeStyle = "rgba(180,120,0,0.4)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(w * 0.81, h * 0.18)
    ctx.lineTo(w * 0.89, h * 0.13)
    ctx.moveTo(w * 0.82, h * 0.1)
    ctx.lineTo(w * 0.88, h * 0.05)
    ctx.stroke()

    // Rainbow mane
    const colors = ["#ff6b9d", "#ffd93d", "#6bcfff"]
    colors.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.ellipse(w * 0.65 + i * 4, h * 0.32 + i * 3, 6, 8, -0.4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Sparkles
    const t = performance.now() / 100
    for (let i = 0; i < 4; i++) {
      const sx = w * 0.5 + Math.sin(t + i * 1.7) * w * 0.5
      const sy = h * 0.4 + Math.cos(t + i * 2.1) * h * 0.4
      drawSparkle(ctx, sx, sy, 3 + Math.sin(t + i) * 1)
    }
  }

  ctx.restore()
}

function drawSparkle(ctx: Ctx, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = "#fff8c0"
  ctx.beginPath()
  ctx.moveTo(0, -size * 2)
  ctx.lineTo(size * 0.4, -size * 0.4)
  ctx.lineTo(size * 2, 0)
  ctx.lineTo(size * 0.4, size * 0.4)
  ctx.lineTo(0, size * 2)
  ctx.lineTo(-size * 0.4, size * 0.4)
  ctx.lineTo(-size * 2, 0)
  ctx.lineTo(-size * 0.4, -size * 0.4)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// ---------- Bogong moth ----------
export function drawMoth(ctx: Ctx, x: number, y: number, w: number, h: number, bob: number) {
  ctx.save()
  ctx.translate(x, y)

  // Glow
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8)
  glow.addColorStop(0, "rgba(255, 217, 61, 0.4)")
  glow.addColorStop(1, "rgba(255, 217, 61, 0)")
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, w * 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Wings flap
  const flap = Math.abs(Math.sin(bob * 4)) * 0.6 + 0.4

  // Back wings
  ctx.fillStyle = "#6b4a32"
  ctx.beginPath()
  ctx.ellipse(w * 0.3, h * 0.55, w * 0.28 * flap, h * 0.45, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.7, h * 0.55, w * 0.28 * flap, h * 0.45, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Front wings
  ctx.fillStyle = "#8a6648"
  ctx.beginPath()
  ctx.ellipse(w * 0.32, h * 0.4, w * 0.32 * flap, h * 0.42, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.68, h * 0.4, w * 0.32 * flap, h * 0.42, 0.4, 0, Math.PI * 2)
  ctx.fill()

  // Wing pattern dots
  ctx.fillStyle = "#3d2817"
  ctx.beginPath()
  ctx.arc(w * 0.22 * flap + w * 0.2, h * 0.4, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w - (w * 0.22 * flap + w * 0.2), h * 0.4, 2, 0, Math.PI * 2)
  ctx.fill()

  // Body
  ctx.fillStyle = "#2d1f15"
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.5, 3, h * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Antennae
  ctx.strokeStyle = "#2d1f15"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w / 2 - 2, h * 0.15)
  ctx.quadraticCurveTo(w * 0.3, 0, w * 0.25, -h * 0.15)
  ctx.moveTo(w / 2 + 2, h * 0.15)
  ctx.quadraticCurveTo(w * 0.7, 0, w * 0.75, -h * 0.15)
  ctx.stroke()

  ctx.restore()
}

// ---------- Enemies ----------
export function drawEnemy(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  variant: number,
  bob: number,
) {
  ctx.save()
  ctx.translate(x, y)

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)"
  ctx.beginPath()
  ctx.ellipse(w / 2, h + 3, w * 0.45, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  if (variant === 0) {
    // Hard-hat turtle
    drawTurtle(ctx, w, h, bob)
  } else if (variant === 1) {
    // Hi-vis kangaroo
    drawKangaroo(ctx, w, h, bob)
  } else {
    // Drop bear with hard hat
    drawDropBear(ctx, w, h, bob)
  }

  ctx.restore()
}

function drawTurtle(ctx: Ctx, w: number, h: number, bob: number) {
  const walk = Math.sin(bob * 3) * 2

  // Legs
  ctx.fillStyle = "#5a8a3a"
  ctx.fillRect(w * 0.15, h * 0.78, 8, 8)
  ctx.fillRect(w * 0.7, h * 0.78, 8, 8)

  // Body/shell base
  ctx.fillStyle = "#4a7a2a"
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.65, w * 0.45, h * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Shell
  ctx.fillStyle = "#3d6022"
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.5, w * 0.42, h * 0.3, 0, Math.PI, 0)
  ctx.fill()

  // Shell pattern
  ctx.strokeStyle = "#2d4a18"
  ctx.lineWidth = 1.5
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.moveTo(w / 2 + i * 12, h * 0.25)
    ctx.lineTo(w / 2 + i * 12, h * 0.45)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(w * 0.15, h * 0.4)
  ctx.lineTo(w * 0.85, h * 0.4)
  ctx.stroke()

  // Head
  ctx.fillStyle = "#5a8a3a"
  ctx.beginPath()
  ctx.arc(w * 0.08, h * 0.55 + walk, 9, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = "#1a1a1a"
  ctx.beginPath()
  ctx.arc(w * 0.05, h * 0.5 + walk, 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Hard hat
  ctx.fillStyle = "#ffb800"
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.25, w * 0.32, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(w * 0.18, h * 0.22, w * 0.64, 4)
  // Hat highlight
  ctx.fillStyle = "#ffd84a"
  ctx.beginPath()
  ctx.ellipse(w * 0.4, h * 0.18, w * 0.12, 3, -0.3, 0, Math.PI * 2)
  ctx.fill()
}

function drawKangaroo(ctx: Ctx, w: number, h: number, bob: number) {
  const hop = Math.abs(Math.sin(bob * 2.5)) * 4

  // Tail
  ctx.fillStyle = "#9a6f3e"
  ctx.beginPath()
  ctx.moveTo(w * 0.05, h * 0.7)
  ctx.quadraticCurveTo(w * -0.1, h * 0.85, w * 0.1, h * 0.95)
  ctx.quadraticCurveTo(w * 0.2, h * 0.85, w * 0.15, h * 0.7)
  ctx.fill()

  // Legs
  ctx.fillStyle = "#8a5f30"
  ctx.fillRect(w * 0.35, h * 0.78 - hop, 10, 18 + hop)

  // Body
  ctx.fillStyle = "#a87a48"
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.55 - hop / 2, w * 0.3, h * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()

  // Hi-vis vest
  ctx.fillStyle = "#d4ff00"
  ctx.beginPath()
  ctx.moveTo(w * 0.3, h * 0.4 - hop / 2)
  ctx.lineTo(w * 0.7, h * 0.4 - hop / 2)
  ctx.lineTo(w * 0.72, h * 0.7 - hop / 2)
  ctx.lineTo(w * 0.28, h * 0.7 - hop / 2)
  ctx.closePath()
  ctx.fill()
  // Reflective stripe
  ctx.fillStyle = "#cccccc"
  ctx.fillRect(w * 0.28, h * 0.55 - hop / 2, w * 0.44, 3)

  // Head
  ctx.fillStyle = "#a87a48"
  ctx.beginPath()
  ctx.ellipse(w * 0.7, h * 0.25 - hop / 2, w * 0.18, h * 0.2, -0.2, 0, Math.PI * 2)
  ctx.fill()

  // Snout
  ctx.beginPath()
  ctx.ellipse(w * 0.85, h * 0.32 - hop / 2, w * 0.1, h * 0.08, -0.2, 0, Math.PI * 2)
  ctx.fill()

  // Ears
  ctx.beginPath()
  ctx.ellipse(w * 0.62, h * 0.1 - hop / 2, 3, 8, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(w * 0.7, h * 0.08 - hop / 2, 3, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eye
  ctx.fillStyle = "#1a1a1a"
  ctx.beginPath()
  ctx.arc(w * 0.75, h * 0.22 - hop / 2, 1.8, 0, Math.PI * 2)
  ctx.fill()

  // Nose
  ctx.fillStyle = "#1a1a1a"
  ctx.beginPath()
  ctx.arc(w * 0.92, h * 0.31 - hop / 2, 1.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawDropBear(ctx: Ctx, w: number, h: number, bob: number) {
  const sway = Math.sin(bob * 2) * 1.5

  // Body
  ctx.fillStyle = "#5a4030"
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.65, w * 0.38, h * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Belly
  ctx.fillStyle = "#7a5a48"
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.7, w * 0.22, h * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()

  // Legs/arms
  ctx.fillStyle = "#4a3020"
  ctx.fillRect(w * 0.25, h * 0.78, 8, 10)
  ctx.fillRect(w * 0.65, h * 0.78, 8, 10)

  // Head
  ctx.fillStyle = "#6a4a38"
  ctx.beginPath()
  ctx.arc(w / 2 + sway, h * 0.32, h * 0.26, 0, Math.PI * 2)
  ctx.fill()

  // Ears (fluffy koala-like)
  ctx.fillStyle = "#7a5a48"
  ctx.beginPath()
  ctx.arc(w * 0.28 + sway, h * 0.22, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.72 + sway, h * 0.22, 8, 0, Math.PI * 2)
  ctx.fill()
  // Inner ear
  ctx.fillStyle = "#c8a88a"
  ctx.beginPath()
  ctx.arc(w * 0.28 + sway, h * 0.23, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.72 + sway, h * 0.23, 4, 0, Math.PI * 2)
  ctx.fill()

  // Hard hat over head
  ctx.fillStyle = "#ffb800"
  ctx.beginPath()
  ctx.arc(w / 2 + sway, h * 0.18, w * 0.3, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(w * 0.2 + sway, h * 0.16, w * 0.6, 4)
  ctx.fillStyle = "#ffd84a"
  ctx.beginPath()
  ctx.ellipse(w * 0.4 + sway, h * 0.12, w * 0.1, 2.5, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Big black nose
  ctx.fillStyle = "#1a1a1a"
  ctx.beginPath()
  ctx.ellipse(w / 2 + sway, h * 0.4, 5, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eyes (menacing)
  ctx.fillStyle = "#ff3a3a"
  ctx.beginPath()
  ctx.arc(w * 0.4 + sway, h * 0.3, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.6 + sway, h * 0.3, 2, 0, Math.PI * 2)
  ctx.fill()

  // Fangs
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.moveTo(w * 0.45 + sway, h * 0.45)
  ctx.lineTo(w * 0.47 + sway, h * 0.52)
  ctx.lineTo(w * 0.49 + sway, h * 0.45)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(w * 0.51 + sway, h * 0.45)
  ctx.lineTo(w * 0.53 + sway, h * 0.52)
  ctx.lineTo(w * 0.55 + sway, h * 0.45)
  ctx.fill()
}

// ---------- Obstacles ----------
export function drawObstacle(ctx: Ctx, x: number, y: number, w: number, h: number, variant: number) {
  ctx.save()
  ctx.translate(x, y)

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)"
  ctx.beginPath()
  ctx.ellipse(w / 2, h + 3, w * 0.5, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  if (variant === 0) {
    // Half-built concrete building
    ctx.fillStyle = "#8a8a8a"
    ctx.fillRect(0, 0, w, h)
    // Floors
    ctx.fillStyle = "#6a6a6a"
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(0, (h / 3) * i, w, 3)
    }
    // Rebar sticking up
    ctx.strokeStyle = "#3a3a3a"
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(8 + i * 16, 0)
      ctx.lineTo(8 + i * 16, -8 - (i % 2) * 4)
      ctx.stroke()
    }
    // Windows
    ctx.fillStyle = "#2a3a4a"
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        ctx.fillRect(8 + col * 28, 8 + row * 28, 16, 16)
      }
    }
    // Hazard tape
    ctx.fillStyle = "#ffb800"
    ctx.fillRect(0, h - 14, w, 8)
    ctx.fillStyle = "#000"
    for (let i = 0; i < w; i += 10) {
      ctx.beginPath()
      ctx.moveTo(i, h - 14)
      ctx.lineTo(i + 5, h - 6)
      ctx.lineTo(i + 5, h - 14)
      ctx.fill()
    }
  } else if (variant === 1) {
    // Scaffolding
    ctx.strokeStyle = "#c8a040"
    ctx.lineWidth = 4
    // Verticals
    ctx.beginPath()
    ctx.moveTo(6, 0)
    ctx.lineTo(6, h)
    ctx.moveTo(w - 6, 0)
    ctx.lineTo(w - 6, h)
    ctx.stroke()
    // Horizontals
    ctx.lineWidth = 3
    for (let i = 0; i <= 4; i++) {
      const y2 = (h / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y2)
      ctx.lineTo(w, y2)
      ctx.stroke()
    }
    // Diagonals
    ctx.lineWidth = 2
    for (let i = 0; i < 4; i++) {
      const yt = (h / 4) * i
      const yb = (h / 4) * (i + 1)
      ctx.beginPath()
      ctx.moveTo(6, yt)
      ctx.lineTo(w - 6, yb)
      ctx.stroke()
    }
    // Top warning flag
    ctx.fillStyle = "#ff3a3a"
    ctx.beginPath()
    ctx.moveTo(w / 2, -2)
    ctx.lineTo(w / 2 + 14, 4)
    ctx.lineTo(w / 2, 10)
    ctx.fill()
  } else {
    // Half-built ski lift pylon
    ctx.fillStyle = "#a8a8a8"
    // Tapered pylon
    ctx.beginPath()
    ctx.moveTo(w * 0.3, 0)
    ctx.lineTo(w * 0.7, 0)
    ctx.lineTo(w * 0.85, h)
    ctx.lineTo(w * 0.15, h)
    ctx.closePath()
    ctx.fill()
    // Cross bars
    ctx.fillStyle = "#7a7a7a"
    ctx.fillRect(0, h * 0.2, w, 4)
    ctx.fillRect(w * 0.05, h * 0.55, w * 0.9, 4)
    // Cable wheel on top
    ctx.fillStyle = "#5a5a5a"
    ctx.beginPath()
    ctx.arc(w / 2, -4, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#ffb800"
    ctx.beginPath()
    ctx.arc(w / 2, -4, 4, 0, Math.PI * 2)
    ctx.fill()
    // Cable
    ctx.strokeStyle = "#3a3a3a"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-20, -4)
    ctx.lineTo(w + 20, -4)
    ctx.stroke()
    // Hazard tape at base
    ctx.fillStyle = "#ffb800"
    ctx.fillRect(w * 0.1, h - 10, w * 0.8, 6)
  }

  ctx.restore()
}

// ---------- Snowflake ----------
export function drawSnowflake(ctx: Ctx, x: number, y: number, size: number) {
  ctx.fillStyle = `rgba(255,255,255,${0.6 + size * 0.1})`
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
}

// ---------- Mountain silhouette ----------
export function drawMountain(
  ctx: Ctx,
  x: number,
  baseY: number,
  width: number,
  peakHeight: number,
  color: string,
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, baseY)
  let cursor = x
  while (cursor < x + width) {
    const peakW = 80 + ((cursor * 7) % 100)
    const peakH = peakHeight * (0.6 + ((cursor * 13) % 60) / 100)
    ctx.lineTo(cursor + peakW / 2, baseY - peakH)
    ctx.lineTo(cursor + peakW, baseY)
    cursor += peakW
  }
  ctx.lineTo(x + width, baseY)
  ctx.closePath()
  ctx.fill()

  // Snow caps
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.beginPath()
  ctx.moveTo(x, baseY)
  cursor = x
  while (cursor < x + width) {
    const peakW = 80 + ((cursor * 7) % 100)
    const peakH = peakHeight * (0.6 + ((cursor * 13) % 60) / 100)
    const capStart = peakH * 0.3
    ctx.moveTo(cursor + peakW / 2 - capStart * 0.5, baseY - peakH + capStart)
    ctx.lineTo(cursor + peakW / 2, baseY - peakH)
    ctx.lineTo(cursor + peakW / 2 + capStart * 0.5, baseY - peakH + capStart)
    ctx.closePath()
    ctx.fill()
    cursor += peakW
  }
}
