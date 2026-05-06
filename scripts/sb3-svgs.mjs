// SVG costumes for the Snowpaw Hero .sb3 build.
// Each export returns an SVG string. They are deliberately compact and
// stylized so the resulting .sb3 stays small and opens cleanly in Scratch.

const svgWrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`

// ---------- Stage backdrop ----------
export const backdrop = svgWrap(
  480,
  360,
  `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#bfe0ff"/>
      <stop offset="1" stop-color="#eaf6ff"/>
    </linearGradient>
  </defs>
  <rect width="480" height="360" fill="url(#sky)"/>
  <circle cx="380" cy="70" r="32" fill="#fff8d6"/>
  <polygon points="0,260 90,150 180,260" fill="#8ea7b6"/>
  <polygon points="120,260 230,90 340,260" fill="#6f8e9f"/>
  <polygon points="280,260 380,140 480,260" fill="#9bb3c1"/>
  <polygon points="210,135 230,90 250,135" fill="#ffffff"/>
  <polygon points="355,170 380,140 405,170" fill="#ffffff"/>
  <rect y="260" width="480" height="100" fill="#f4faff"/>
  <rect y="258" width="480" height="6" fill="#d7e6f0"/>
  <circle cx="60" cy="300" r="14" fill="#e6eef5"/>
  <circle cx="200" cy="320" r="20" fill="#e6eef5"/>
  <circle cx="340" cy="305" r="16" fill="#e6eef5"/>
  <circle cx="430" cy="325" r="22" fill="#e6eef5"/>
`,
)

// ---------- Background scrolling strip (480 wide so x +/- 480 loop) ----------
export const backgroundStrip = svgWrap(
  480,
  360,
  `
  <rect width="480" height="360" fill="none"/>
  <polygon points="-20,260 70,170 160,260" fill="#7d97a7" opacity="0.85"/>
  <polygon points="120,260 240,120 360,260" fill="#5f7e90" opacity="0.85"/>
  <polygon points="320,260 420,160 500,260" fill="#8ba4b3" opacity="0.85"/>
  <polygon points="220,160 240,120 260,160" fill="#ffffff"/>
  <polygon points="395,180 420,160 445,180" fill="#ffffff"/>
  <ellipse cx="80" cy="290" rx="22" ry="8" fill="#cfdbe5"/>
  <ellipse cx="260" cy="300" rx="30" ry="10" fill="#cfdbe5"/>
  <ellipse cx="420" cy="295" rx="24" ry="9" fill="#cfdbe5"/>
  <circle cx="40" cy="100" r="3" fill="#ffffff" opacity="0.7"/>
  <circle cx="180" cy="60" r="2" fill="#ffffff" opacity="0.7"/>
  <circle cx="300" cy="90" r="3" fill="#ffffff" opacity="0.7"/>
  <circle cx="430" cy="50" r="2" fill="#ffffff" opacity="0.7"/>
`,
)

// ---------- Snowpaw possum ----------
function possumBody({ unicorn = false, leg = 0, jumping = false }) {
  // leg: 0 or 1 (animation frame); when jumping, legs tuck up
  const legY1 = jumping ? 38 : 40 + (leg ? 0 : 4)
  const legY2 = jumping ? 38 : 40 + (leg ? 4 : 0)
  const mane = unicorn
    ? `
    <path d="M22 14 Q14 8 18 22" stroke="#ff7eb6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M22 14 Q14 8 22 26" stroke="#ffd166" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M22 14 Q14 8 26 28" stroke="#7ad7ff" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : ''
  const horn = unicorn
    ? `<polygon points="32,4 36,14 28,14" fill="#ffe066" stroke="#caa84a" stroke-width="0.6"/>`
    : ''
  const sparkles = unicorn
    ? `
    <circle cx="6" cy="14" r="1.6" fill="#fff"/>
    <circle cx="58" cy="22" r="1.4" fill="#fff"/>
    <circle cx="50" cy="6" r="1.2" fill="#fff"/>`
    : ''
  return `
    ${sparkles}
    <ellipse cx="32" cy="30" rx="20" ry="13" fill="#a07550"/>
    <ellipse cx="32" cy="30" rx="20" ry="13" fill="none" stroke="#6e4f33" stroke-width="0.8"/>
    <ellipse cx="46" cy="22" rx="9" ry="9" fill="#a07550" stroke="#6e4f33" stroke-width="0.8"/>
    <ellipse cx="22" cy="18" rx="4" ry="5" fill="#a07550" stroke="#6e4f33" stroke-width="0.8"/>
    <ellipse cx="42" cy="22" rx="3" ry="4" fill="#a07550" stroke="#6e4f33" stroke-width="0.8"/>
    ${horn}
    ${mane}
    <circle cx="49" cy="22" r="1.6" fill="#1a1a1a"/>
    <circle cx="49.4" cy="21.4" r="0.5" fill="#fff"/>
    <ellipse cx="53" cy="25" rx="1.4" ry="1" fill="#2b1d12"/>
    <path d="M14 32 Q4 28 8 22" stroke="#6e4f33" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="22" cy="${legY1}" rx="2.4" ry="3.4" fill="#6e4f33"/>
    <ellipse cx="34" cy="${legY2}" rx="2.4" ry="3.4" fill="#6e4f33"/>
    <ellipse cx="42" cy="${legY1}" rx="2.4" ry="3.4" fill="#6e4f33"/>
    <ellipse cx="32" cy="36" rx="14" ry="3" fill="#cdb59a" opacity="0.55"/>
  `
}

export const snowpawCostumes = {
  Run_1: svgWrap(64, 50, possumBody({ unicorn: false, leg: 0 })),
  Run_2: svgWrap(64, 50, possumBody({ unicorn: false, leg: 1 })),
  Jump: svgWrap(64, 50, possumBody({ unicorn: false, jumping: true })),
  Unicorn_Run_1: svgWrap(64, 50, possumBody({ unicorn: true, leg: 0 })),
  Unicorn_Run_2: svgWrap(64, 50, possumBody({ unicorn: true, leg: 1 })),
  Unicorn_Jump: svgWrap(64, 50, possumBody({ unicorn: true, jumping: true })),
}

// ---------- Bogong moth ----------
export const moth = svgWrap(
  32,
  28,
  `
  <ellipse cx="16" cy="14" rx="2" ry="6" fill="#3d2c1e"/>
  <path d="M16 14 Q4 4 6 18 Q10 16 16 14 Z" fill="#a4825a" stroke="#3d2c1e" stroke-width="0.6"/>
  <path d="M16 14 Q28 4 26 18 Q22 16 16 14 Z" fill="#a4825a" stroke="#3d2c1e" stroke-width="0.6"/>
  <path d="M16 14 Q5 22 8 26 Q12 22 16 14 Z" fill="#8a6a48" stroke="#3d2c1e" stroke-width="0.6"/>
  <path d="M16 14 Q27 22 24 26 Q20 22 16 14 Z" fill="#8a6a48" stroke="#3d2c1e" stroke-width="0.6"/>
  <circle cx="13" cy="11" r="1" fill="#fff" opacity="0.7"/>
  <circle cx="19" cy="11" r="1" fill="#fff" opacity="0.7"/>
  <line x1="16" y1="9" x2="13" y2="4" stroke="#3d2c1e" stroke-width="0.8" stroke-linecap="round"/>
  <line x1="16" y1="9" x2="19" y2="4" stroke="#3d2c1e" stroke-width="0.8" stroke-linecap="round"/>
`,
)

// ---------- Enemies & obstacles ----------
export const hardHatTurtle = svgWrap(
  56,
  44,
  `
  <ellipse cx="28" cy="32" rx="22" ry="10" fill="#5b8a3a" stroke="#33531f" stroke-width="1"/>
  <path d="M10 32 Q28 14 46 32 Z" fill="#7eaf57" stroke="#33531f" stroke-width="1"/>
  <path d="M16 28 Q28 18 40 28" stroke="#33531f" stroke-width="0.8" fill="none"/>
  <ellipse cx="46" cy="34" rx="6" ry="5" fill="#a37a48" stroke="#5a4222" stroke-width="0.8"/>
  <circle cx="49" cy="33" r="1" fill="#1a1a1a"/>
  <ellipse cx="14" cy="40" rx="3" ry="2" fill="#a37a48"/>
  <ellipse cx="42" cy="40" rx="3" ry="2" fill="#a37a48"/>
  <path d="M30 18 Q28 8 38 10 Q34 14 38 18 Z" fill="#ffd23f" stroke="#a8801f" stroke-width="0.8"/>
  <rect x="28" y="14" width="14" height="3" fill="#ffd23f" stroke="#a8801f" stroke-width="0.8"/>
`,
)

export const kangarooVis = svgWrap(
  44,
  64,
  `
  <ellipse cx="22" cy="40" rx="12" ry="14" fill="#b07a4a" stroke="#6e4a26" stroke-width="0.8"/>
  <rect x="12" y="36" width="20" height="14" fill="#ff7a1f" stroke="#a44a0e" stroke-width="0.8"/>
  <rect x="14" y="42" width="16" height="3" fill="#ffe066" opacity="0.9"/>
  <ellipse cx="32" cy="22" rx="9" ry="10" fill="#b07a4a" stroke="#6e4a26" stroke-width="0.8"/>
  <path d="M28 14 Q26 6 30 8 Q31 12 31 16 Z" fill="#b07a4a" stroke="#6e4a26" stroke-width="0.8"/>
  <path d="M36 14 Q38 6 34 8 Q33 12 33 16 Z" fill="#b07a4a" stroke="#6e4a26" stroke-width="0.8"/>
  <circle cx="36" cy="22" r="1.4" fill="#1a1a1a"/>
  <ellipse cx="40" cy="24" rx="1.6" ry="1" fill="#3d2418"/>
  <ellipse cx="14" cy="58" rx="10" ry="3" fill="#6e4a26"/>
  <path d="M10 50 Q2 56 6 60" stroke="#6e4a26" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="22" cy="62" rx="4" ry="2" fill="#3d2418" opacity="0.5"/>
`,
)

export const dropBearHat = svgWrap(
  40,
  40,
  `
  <ellipse cx="20" cy="24" rx="14" ry="12" fill="#6c6c6c" stroke="#3a3a3a" stroke-width="0.8"/>
  <ellipse cx="9" cy="18" rx="5" ry="5" fill="#6c6c6c" stroke="#3a3a3a" stroke-width="0.8"/>
  <ellipse cx="31" cy="18" rx="5" ry="5" fill="#6c6c6c" stroke="#3a3a3a" stroke-width="0.8"/>
  <circle cx="9" cy="18" r="2.4" fill="#a89c8e"/>
  <circle cx="31" cy="18" r="2.4" fill="#a89c8e"/>
  <circle cx="14" cy="22" r="1.6" fill="#1a1a1a"/>
  <circle cx="26" cy="22" r="1.6" fill="#1a1a1a"/>
  <ellipse cx="20" cy="28" rx="3" ry="2" fill="#1a1a1a"/>
  <path d="M16 30 Q20 34 24 30" stroke="#1a1a1a" stroke-width="0.8" fill="none"/>
  <path d="M6 14 Q20 -2 34 14 L34 16 L6 16 Z" fill="#ffd23f" stroke="#a8801f" stroke-width="0.8"/>
  <rect x="14" y="6" width="12" height="3" fill="#ff7a1f"/>
  <ellipse cx="20" cy="38" rx="10" ry="2" fill="#3a3a3a" opacity="0.4"/>
`,
)

export const scaffolding = svgWrap(
  60,
  90,
  `
  <rect x="6" y="6" width="48" height="80" fill="none" stroke="#9aa0a6" stroke-width="3"/>
  <line x1="6" y1="30" x2="54" y2="30" stroke="#9aa0a6" stroke-width="3"/>
  <line x1="6" y1="58" x2="54" y2="58" stroke="#9aa0a6" stroke-width="3"/>
  <line x1="30" y1="6" x2="30" y2="86" stroke="#9aa0a6" stroke-width="3"/>
  <line x1="6" y1="6" x2="54" y2="30" stroke="#bcc2c8" stroke-width="2"/>
  <line x1="54" y1="6" x2="6" y2="30" stroke="#bcc2c8" stroke-width="2"/>
  <line x1="6" y1="30" x2="54" y2="58" stroke="#bcc2c8" stroke-width="2"/>
  <line x1="54" y1="30" x2="6" y2="58" stroke="#bcc2c8" stroke-width="2"/>
  <rect x="2" y="84" width="56" height="6" fill="#7c828a"/>
  <rect x="0" y="0" width="60" height="4" fill="#ffd23f"/>
  <rect x="0" y="0" width="60" height="4" fill="#ffd23f"/>
`,
)

export const resortBuilding = svgWrap(
  84,
  96,
  `
  <rect x="6" y="20" width="72" height="74" fill="#c9c2b4" stroke="#7d7464" stroke-width="1.2"/>
  <rect x="6" y="20" width="72" height="6" fill="#a89e8a"/>
  <rect x="14" y="32" width="14" height="14" fill="#3a4a55"/>
  <rect x="34" y="32" width="14" height="14" fill="#3a4a55"/>
  <rect x="54" y="32" width="14" height="14" fill="#3a4a55"/>
  <rect x="14" y="54" width="14" height="14" fill="#3a4a55"/>
  <rect x="54" y="54" width="14" height="14" fill="#3a4a55"/>
  <rect x="34" y="76" width="16" height="18" fill="#5a4a36"/>
  <line x1="20" y1="0" x2="20" y2="22" stroke="#7d7464" stroke-width="2"/>
  <line x1="40" y1="0" x2="40" y2="22" stroke="#7d7464" stroke-width="2"/>
  <line x1="60" y1="0" x2="60" y2="22" stroke="#7d7464" stroke-width="2"/>
  <line x1="20" y1="2" x2="22" y2="6" stroke="#a04040" stroke-width="2"/>
  <line x1="40" y1="2" x2="42" y2="6" stroke="#a04040" stroke-width="2"/>
  <line x1="60" y1="2" x2="62" y2="6" stroke="#a04040" stroke-width="2"/>
  <rect x="0" y="14" width="84" height="4" fill="#ffd23f"/>
  <rect x="34" y="54" width="14" height="14" fill="none" stroke="#7d7464" stroke-width="1" stroke-dasharray="2 2"/>
`,
)

// ---------- Fact bubble ----------
export const bubble = svgWrap(
  220,
  90,
  `
  <rect x="6" y="6" width="208" height="64" rx="14" ry="14" fill="#fffdf5" stroke="#3a2f1f" stroke-width="2"/>
  <polygon points="40,68 56,68 44,84" fill="#fffdf5" stroke="#3a2f1f" stroke-width="2"/>
  <polygon points="40,68 56,68 44,84" fill="#fffdf5"/>
`,
)
