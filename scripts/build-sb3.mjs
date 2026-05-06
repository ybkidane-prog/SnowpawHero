// Generates a working Scratch 3.0 .sb3 archive for Snowpaw Hero.
// Output: public/snowpaw-hero.sb3
//
// An .sb3 is just a ZIP containing project.json + asset files named
// `${md5}.${ext}`. We build everything programmatically so no editor is needed.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

import {
  backdrop,
  backgroundStrip,
  snowpawCostumes,
  moth as mothSvg,
  hardHatTurtle,
  kangarooVis,
  dropBearHat,
  scaffolding,
  resortBuilding,
  bubble,
} from './sb3-svgs.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })

// ---------------- Stable IDs ----------------
const VID = (n) => 'v_' + n
const LID = (n) => 'l_' + n
const BCID = (n) => 'bc_' + n

// ---------------- Asset helpers ----------------
const assetBuffers = new Map() // md5+ext -> Buffer

function addSvgAsset(svg) {
  const buf = Buffer.from(svg, 'utf8')
  const hash = crypto.createHash('md5').update(buf).digest('hex')
  const md5ext = `${hash}.svg`
  if (!assetBuffers.has(md5ext)) assetBuffers.set(md5ext, buf)
  return { assetId: hash, md5ext }
}

function makeCostume(name, svg, rotX, rotY) {
  const { assetId, md5ext } = addSvgAsset(svg)
  return {
    name,
    bitmapResolution: 1,
    dataFormat: 'svg',
    assetId,
    md5ext,
    rotationCenterX: rotX,
    rotationCenterY: rotY,
  }
}

// ---------------- Block Builder ----------------
let _bid = 0
const newBlockId = () => 'B' + (++_bid).toString(36)

function makeBuilder() {
  const blocks = {}
  let cursorY = 30

  function rawAdd(opcode, opts = {}) {
    const id = newBlockId()
    blocks[id] = {
      opcode,
      next: null,
      parent: null,
      inputs: {},
      fields: {},
      shadow: !!opts.shadow,
      topLevel: false,
    }
    if (opts.mutation) blocks[id].mutation = opts.mutation
    return id
  }

  function setParent(child, parent) {
    if (child && blocks[child]) blocks[child].parent = parent
  }

  // Resolve an input descriptor into the inputs[] array form.
  // Sets parent of any embedded block to `parentId`.
  function resolveInput(desc, parentId) {
    if (!Array.isArray(desc)) throw new Error('input must be tuple')
    const kind = desc[0]
    if (kind === 'num') return [1, [4, String(desc[1])]]
    if (kind === 'int') return [1, [7, String(desc[1])]]
    if (kind === 'str') return [1, [10, String(desc[1])]]
    if (kind === 'var') return [3, [12, desc[1], VID(desc[1])], [10, '']]
    if (kind === 'list') return [3, [13, desc[1], LID(desc[1])], [10, '']]
    if (kind === 'broadcast') return [1, [11, desc[1], BCID(desc[1])]]
    if (kind === 'rep') {
      setParent(desc[1], parentId)
      return [3, desc[1], [4, '0']]
    }
    if (kind === 'repStr') {
      setParent(desc[1], parentId)
      return [3, desc[1], [10, '']]
    }
    if (kind === 'bool') {
      setParent(desc[1], parentId)
      return [2, desc[1]]
    }
    if (kind === 'stack') {
      setParent(desc[1], parentId)
      return [2, desc[1]]
    }
    if (kind === 'shadow') {
      // shadow-only block (e.g., a menu dropdown)
      setParent(desc[1], parentId)
      return [1, desc[1]]
    }
    if (kind === 'repShadow') {
      // reporter dropped onto a shadow input (e.g., switch costume to <reporter>)
      setParent(desc[1], parentId)
      setParent(desc[2], parentId)
      return [3, desc[1], desc[2]]
    }
    throw new Error('Unknown input kind: ' + kind)
  }

  function resolveField(desc) {
    const kind = desc[0]
    if (kind === 'var') return [desc[1], VID(desc[1])]
    if (kind === 'list') return [desc[1], LID(desc[1])]
    if (kind === 'broadcast') return [desc[1], BCID(desc[1])]
    if (kind === 'raw') return desc[1]
    if (kind === 'opt') return [desc[1], null]
    throw new Error('Unknown field kind: ' + kind)
  }

  // Build a block in one call.
  function mk(opcode, opts = {}) {
    const id = rawAdd(opcode, { shadow: opts.shadow, mutation: opts.mutation })
    const block = blocks[id]
    if (opts.inputs) {
      for (const [name, desc] of Object.entries(opts.inputs)) {
        block.inputs[name] = resolveInput(desc, id)
      }
    }
    if (opts.fields) {
      for (const [name, desc] of Object.entries(opts.fields)) {
        block.fields[name] = resolveField(desc)
      }
    }
    return id
  }

  // Chain a list of stack-block IDs into a top-level script.
  function script(stack) {
    if (!stack || !stack.length) return
    for (let i = 0; i < stack.length; i++) {
      const b = blocks[stack[i]]
      b.parent = i === 0 ? null : stack[i - 1]
      b.next = i < stack.length - 1 ? stack[i + 1] : null
    }
    const head = blocks[stack[0]]
    head.topLevel = true
    head.x = 30
    head.y = cursorY
    cursorY += 600
  }

  // Chain a list of stack-block IDs as a sub-stack inside `parent`.
  // Returns the head block ID.
  function subStack(stack, parent) {
    if (!stack || !stack.length) return null
    for (let i = 0; i < stack.length; i++) {
      const b = blocks[stack[i]]
      b.parent = i === 0 ? parent : stack[i - 1]
      b.next = i < stack.length - 1 ? stack[i + 1] : null
    }
    return stack[0]
  }

  return { blocks, mk, script, subStack, setParent, rawAdd }
}

// ---------------- Convenience factories ----------------
function shadowMenu(b, opcode, fieldName, value) {
  return b.mk(opcode, { shadow: true, fields: { [fieldName]: ['opt', value] } })
}

// ---------------- TARGET: Stage ----------------
function buildStage() {
  const b = makeBuilder()

  // when flag clicked -> broadcast Start_Game
  const flag = b.mk('event_whenflagclicked')
  const bcStart = b.mk('event_broadcast', {
    inputs: { BROADCAST_INPUT: ['broadcast', 'Start_Game'] },
  })
  b.script([flag, bcStart])

  // when receive Game_Over -> stop all
  const hatGO = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Game_Over'] },
  })
  const stopAll = b.mk('control_stop', {
    fields: { STOP_OPTION: ['opt', 'all'] },
    mutation: { tagName: 'mutation', children: [], hasnext: 'false' },
  })
  b.script([hatGO, stopAll])

  return {
    isStage: true,
    name: 'Stage',
    variables: {
      [VID('Score')]: ['Score', 0],
      [VID('Moth_Count')]: ['Moth_Count', 0],
      [VID('Scroll_Speed')]: ['Scroll_Speed', 0],
      [VID('Unicorn_Mode')]: ['Unicorn_Mode', 0],
    },
    lists: {
      [LID('Pygmy_Facts')]: ['Pygmy_Facts', []],
    },
    broadcasts: {
      [BCID('Start_Game')]: 'Start_Game',
      [BCID('Trigger_Unicorn')]: 'Trigger_Unicorn',
      [BCID('End_Unicorn')]: 'End_Unicorn',
      [BCID('Show_Fact')]: 'Show_Fact',
      [BCID('Game_Over')]: 'Game_Over',
    },
    blocks: b.blocks,
    comments: {},
    currentCostume: 0,
    costumes: [makeCostume('Alpine_Snow', backdrop, 240, 180)],
    sounds: [],
    volume: 100,
    layerOrder: 0,
    tempo: 60,
    videoTransparency: 50,
    videoState: 'on',
    textToSpeechLanguage: null,
  }
}

// ---------------- TARGET: Snowpaw ----------------
function buildSnowpaw(layer) {
  const b = makeBuilder()

  // ---- when receive Start_Game ----
  const hatStart = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Start_Game'] },
  })
  const goto = b.mk('motion_gotoxy', {
    inputs: { X: ['num', -150], Y: ['num', -100] },
  })
  const setVel = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Y_Velocity'] },
  })
  const setJump = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Is_Jumping'] },
  })
  const setUni = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Unicorn_Mode'] },
  })
  const setScore = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Score'] },
  })
  const setMothCount = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Moth_Count'] },
  })
  const setScrollSpeed = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', -6] },
    fields: { VARIABLE: ['var', 'Scroll_Speed'] },
  })
  const showSelf = b.mk('looks_show')
  const setCostume0 = b.mk('looks_switchcostumeto', {
    inputs: { COSTUME: ['shadow', shadowMenu(b, 'looks_costume', 'COSTUME', 'Run_1')] },
  })

  // ---- forever: physics + jump ----
  // Inside forever:
  //   change Y_Velocity by (-1.5)
  //   change y by Y_Velocity
  //   if y < -100: set y to -100, set Y_Velocity 0, set Is_Jumping 0
  //   if (key space pressed or mouse down) and Is_Jumping = 0:
  //     if Unicorn_Mode = 1: set Y_Velocity 22 else set Y_Velocity 15
  //     set Is_Jumping 1
  const changeVelGrav = b.mk('data_changevariableby', {
    inputs: { VALUE: ['num', -1.5] },
    fields: { VARIABLE: ['var', 'Y_Velocity'] },
  })
  const changeYByVel = b.mk('motion_changeyby', {
    inputs: { DY: ['var', 'Y_Velocity'] },
  })

  // y < -100
  const yPos = b.mk('motion_yposition')
  const ltY = b.mk('operator_lt', {
    inputs: { OPERAND1: ['rep', yPos], OPERAND2: ['num', -100] },
  })
  const setY = b.mk('motion_sety', { inputs: { Y: ['num', -100] } })
  const setVel0 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Y_Velocity'] },
  })
  const setJump0 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Is_Jumping'] },
  })
  const ifFloor = b.mk('control_if', {
    inputs: { CONDITION: ['bool', ltY] },
  })
  const floorBody = b.subStack([setY, setVel0, setJump0], ifFloor)
  b.blocks[ifFloor].inputs.SUBSTACK = [2, floorBody]

  // key space pressed?
  const keyMenu = shadowMenu(b, 'sensing_keyoptions', 'KEY_OPTION', 'space')
  const keySpace = b.mk('sensing_keypressed', {
    inputs: { KEY_OPTION: ['shadow', keyMenu] },
  })
  const mouseDown = b.mk('sensing_mousedown')
  const orInput = b.mk('operator_or', {
    inputs: { OPERAND1: ['bool', keySpace], OPERAND2: ['bool', mouseDown] },
  })
  // Is_Jumping = 0
  const eqJump0 = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Is_Jumping'], OPERAND2: ['num', 0] },
  })
  const andInput = b.mk('operator_and', {
    inputs: { OPERAND1: ['bool', orInput], OPERAND2: ['bool', eqJump0] },
  })
  const eqUni1 = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Unicorn_Mode'], OPERAND2: ['num', 1] },
  })
  const setVel22 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 22] },
    fields: { VARIABLE: ['var', 'Y_Velocity'] },
  })
  const setVel15 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 15] },
    fields: { VARIABLE: ['var', 'Y_Velocity'] },
  })
  const ifElseUni = b.mk('control_if_else', {
    inputs: { CONDITION: ['bool', eqUni1] },
  })
  const ifUniThen = b.subStack([setVel22], ifElseUni)
  const ifUniElse = b.subStack([setVel15], ifElseUni)
  b.blocks[ifElseUni].inputs.SUBSTACK = [2, ifUniThen]
  b.blocks[ifElseUni].inputs.SUBSTACK2 = [2, ifUniElse]
  const setJump1 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 1] },
    fields: { VARIABLE: ['var', 'Is_Jumping'] },
  })
  const ifJumpInput = b.mk('control_if', {
    inputs: { CONDITION: ['bool', andInput] },
  })
  const jumpBody = b.subStack([ifElseUni, setJump1], ifJumpInput)
  b.blocks[ifJumpInput].inputs.SUBSTACK = [2, jumpBody]

  const forever = b.mk('control_forever')
  const foreverBody = b.subStack(
    [changeVelGrav, changeYByVel, ifFloor, ifJumpInput],
    forever,
  )
  b.blocks[forever].inputs.SUBSTACK = [2, foreverBody]

  b.script([
    hatStart,
    goto,
    setVel,
    setJump,
    setUni,
    setScore,
    setMothCount,
    setScrollSpeed,
    showSelf,
    setCostume0,
    forever,
  ])

  // ---- when receive Trigger_Unicorn ----
  const hatUni = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Trigger_Unicorn'] },
  })
  const setUni1 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 1] },
    fields: { VARIABLE: ['var', 'Unicorn_Mode'] },
  })
  const bcShowFact = b.mk('event_broadcast', {
    inputs: { BROADCAST_INPUT: ['broadcast', 'Show_Fact'] },
  })
  const wait5 = b.mk('control_wait', { inputs: { DURATION: ['num', 5] } })
  const setUni0 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Unicorn_Mode'] },
  })
  const bcEndUni = b.mk('event_broadcast', {
    inputs: { BROADCAST_INPUT: ['broadcast', 'End_Unicorn'] },
  })
  b.script([hatUni, setUni1, bcShowFact, wait5, setUni0, bcEndUni])

  // ---- Animation loop ----
  // when receive Start_Game (separate stack):
  // forever:
  //   if Unicorn_Mode = 1:
  //     if Is_Jumping = 1: switch to Unicorn_Jump
  //     else: switch to Unicorn_Run_1, wait 0.1, switch to Unicorn_Run_2, wait 0.1
  //   else:
  //     if Is_Jumping = 1: switch to Jump
  //     else: switch to Run_1, wait 0.1, switch to Run_2, wait 0.1
  const hatStartAnim = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Start_Game'] },
  })
  function costumeBlock(name) {
    return b.mk('looks_switchcostumeto', {
      inputs: { COSTUME: ['shadow', shadowMenu(b, 'looks_costume', 'COSTUME', name)] },
    })
  }
  const swUniJump = costumeBlock('Unicorn_Jump')
  const swUniR1 = costumeBlock('Unicorn_Run_1')
  const wait1 = b.mk('control_wait', { inputs: { DURATION: ['num', 0.1] } })
  const swUniR2 = costumeBlock('Unicorn_Run_2')
  const wait2 = b.mk('control_wait', { inputs: { DURATION: ['num', 0.1] } })

  const eqJump1Uni = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Is_Jumping'], OPERAND2: ['num', 1] },
  })
  const ifElseJumpUni = b.mk('control_if_else', {
    inputs: { CONDITION: ['bool', eqJump1Uni] },
  })
  const uniThen = b.subStack([swUniJump], ifElseJumpUni)
  const uniElse = b.subStack([swUniR1, wait1, swUniR2, wait2], ifElseJumpUni)
  b.blocks[ifElseJumpUni].inputs.SUBSTACK = [2, uniThen]
  b.blocks[ifElseJumpUni].inputs.SUBSTACK2 = [2, uniElse]

  const swJump = costumeBlock('Jump')
  const swR1 = costumeBlock('Run_1')
  const wait3 = b.mk('control_wait', { inputs: { DURATION: ['num', 0.1] } })
  const swR2 = costumeBlock('Run_2')
  const wait4 = b.mk('control_wait', { inputs: { DURATION: ['num', 0.1] } })
  const eqJump1Norm = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Is_Jumping'], OPERAND2: ['num', 1] },
  })
  const ifElseJumpNorm = b.mk('control_if_else', {
    inputs: { CONDITION: ['bool', eqJump1Norm] },
  })
  const normThen = b.subStack([swJump], ifElseJumpNorm)
  const normElse = b.subStack([swR1, wait3, swR2, wait4], ifElseJumpNorm)
  b.blocks[ifElseJumpNorm].inputs.SUBSTACK = [2, normThen]
  b.blocks[ifElseJumpNorm].inputs.SUBSTACK2 = [2, normElse]

  const eqUniMode = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Unicorn_Mode'], OPERAND2: ['num', 1] },
  })
  const ifElseAnim = b.mk('control_if_else', {
    inputs: { CONDITION: ['bool', eqUniMode] },
  })
  const animThen = b.subStack([ifElseJumpUni], ifElseAnim)
  const animElse = b.subStack([ifElseJumpNorm], ifElseAnim)
  b.blocks[ifElseAnim].inputs.SUBSTACK = [2, animThen]
  b.blocks[ifElseAnim].inputs.SUBSTACK2 = [2, animElse]

  const animForever = b.mk('control_forever')
  const animBody = b.subStack([ifElseAnim], animForever)
  b.blocks[animForever].inputs.SUBSTACK = [2, animBody]
  b.script([hatStartAnim, animForever])

  return {
    isStage: false,
    name: 'Snowpaw',
    variables: {
      [VID('Y_Velocity')]: ['Y_Velocity', 0],
      [VID('Is_Jumping')]: ['Is_Jumping', 0],
    },
    lists: {},
    broadcasts: {},
    blocks: b.blocks,
    comments: {},
    currentCostume: 0,
    costumes: [
      makeCostume('Run_1', snowpawCostumes.Run_1, 32, 25),
      makeCostume('Run_2', snowpawCostumes.Run_2, 32, 25),
      makeCostume('Jump', snowpawCostumes.Jump, 32, 25),
      makeCostume('Unicorn_Run_1', snowpawCostumes.Unicorn_Run_1, 32, 25),
      makeCostume('Unicorn_Run_2', snowpawCostumes.Unicorn_Run_2, 32, 25),
      makeCostume('Unicorn_Jump', snowpawCostumes.Unicorn_Jump, 32, 25),
    ],
    sounds: [],
    volume: 100,
    layerOrder: layer,
    visible: true,
    x: -150,
    y: -100,
    size: 200,
    direction: 90,
    draggable: false,
    rotationStyle: "don't rotate",
  }
}

// ---------------- TARGET: Background ----------------
function buildBackground(layer) {
  const b = makeBuilder()

  // when receive Start_Game (main):
  // go to (0, 0); show; create clone of myself
  // forever: change x by Scroll_Speed; if x < -480 set x to 480
  const hat = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Start_Game'] },
  })
  const goBack = b.mk('looks_gotofrontback', {
    fields: { FRONT_BACK: ['opt', 'back'] },
  })
  const goto = b.mk('motion_gotoxy', { inputs: { X: ['num', 0], Y: ['num', 0] } })
  const show = b.mk('looks_show')
  const cloneMenu = shadowMenu(b, 'control_create_clone_of_menu', 'CLONE_OPTION', '_myself_')
  const createClone = b.mk('control_create_clone_of', {
    inputs: { CLONE_OPTION: ['shadow', cloneMenu] },
  })

  const changeXMain = b.mk('motion_changexby', { inputs: { DX: ['var', 'Scroll_Speed'] } })
  const xPosMain = b.mk('motion_xposition')
  const ltX = b.mk('operator_lt', {
    inputs: { OPERAND1: ['rep', xPosMain], OPERAND2: ['num', -480] },
  })
  const setX480 = b.mk('motion_setx', { inputs: { X: ['num', 480] } })
  const ifWrap = b.mk('control_if', { inputs: { CONDITION: ['bool', ltX] } })
  const wrapBody = b.subStack([setX480], ifWrap)
  b.blocks[ifWrap].inputs.SUBSTACK = [2, wrapBody]

  const fv = b.mk('control_forever')
  const fvBody = b.subStack([changeXMain, ifWrap], fv)
  b.blocks[fv].inputs.SUBSTACK = [2, fvBody]

  b.script([hat, goBack, goto, show, createClone, fv])

  // when start as clone: go to (480, 0); show; forever scroll & wrap
  const cloneHat = b.mk('control_start_as_clone')
  const cgoto = b.mk('motion_gotoxy', { inputs: { X: ['num', 480], Y: ['num', 0] } })
  const cshow = b.mk('looks_show')

  const cChangeX = b.mk('motion_changexby', { inputs: { DX: ['var', 'Scroll_Speed'] } })
  const cXpos = b.mk('motion_xposition')
  const cLt = b.mk('operator_lt', {
    inputs: { OPERAND1: ['rep', cXpos], OPERAND2: ['num', -480] },
  })
  const cSetX = b.mk('motion_setx', { inputs: { X: ['num', 480] } })
  const cIf = b.mk('control_if', { inputs: { CONDITION: ['bool', cLt] } })
  const cIfBody = b.subStack([cSetX], cIf)
  b.blocks[cIf].inputs.SUBSTACK = [2, cIfBody]
  const cFv = b.mk('control_forever')
  const cFvBody = b.subStack([cChangeX, cIf], cFv)
  b.blocks[cFv].inputs.SUBSTACK = [2, cFvBody]
  b.script([cloneHat, cgoto, cshow, cFv])

  // when flag clicked: hide (so editor preview is clean before play)
  const flagHide = b.mk('event_whenflagclicked')
  const hide = b.mk('looks_hide')
  b.script([flagHide, hide])

  return {
    isStage: false,
    name: 'Background',
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: b.blocks,
    comments: {},
    currentCostume: 0,
    costumes: [makeCostume('Alpine_Strip', backgroundStrip, 240, 180)],
    sounds: [],
    volume: 100,
    layerOrder: layer,
    visible: false,
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: "don't rotate",
  }
}

// ---------------- TARGET: Moth (collectibles) ----------------
function buildMoth(layer) {
  const b = makeBuilder()

  // when receive Start_Game: hide; forever wait random; create clone
  const hat = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Start_Game'] },
  })
  const hide = b.mk('looks_hide')

  const rand1 = b.mk('operator_random', {
    inputs: { FROM: ['num', 1.5], TO: ['num', 3.5] },
  })
  const wait = b.mk('control_wait', { inputs: { DURATION: ['rep', rand1] } })
  const cloneMenu = shadowMenu(b, 'control_create_clone_of_menu', 'CLONE_OPTION', '_myself_')
  const createClone = b.mk('control_create_clone_of', {
    inputs: { CLONE_OPTION: ['shadow', cloneMenu] },
  })
  const fv = b.mk('control_forever')
  const fvBody = b.subStack([wait, createClone], fv)
  b.blocks[fv].inputs.SUBSTACK = [2, fvBody]

  b.script([hat, hide, fv])

  // when start as clone:
  // show; go to (240, random -50..100)
  // forever: change x by Scroll_Speed; if touching Snowpaw -> +score, +moths, maybe trigger; if x < -240 delete
  const cloneHat = b.mk('control_start_as_clone')
  const cshow = b.mk('looks_show')
  const randY = b.mk('operator_random', {
    inputs: { FROM: ['num', -50], TO: ['num', 100] },
  })
  const cgoto = b.mk('motion_gotoxy', {
    inputs: { X: ['num', 240], Y: ['rep', randY] },
  })

  const cChangeX = b.mk('motion_changexby', { inputs: { DX: ['var', 'Scroll_Speed'] } })

  // touching Snowpaw?
  const touchMenu = shadowMenu(b, 'sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU', 'Snowpaw')
  const touching = b.mk('sensing_touchingobject', {
    inputs: { TOUCHINGOBJECTMENU: ['shadow', touchMenu] },
  })

  const incScore = b.mk('data_changevariableby', {
    inputs: { VALUE: ['num', 1] },
    fields: { VARIABLE: ['var', 'Score'] },
  })
  const incMoth = b.mk('data_changevariableby', {
    inputs: { VALUE: ['num', 1] },
    fields: { VARIABLE: ['var', 'Moth_Count'] },
  })

  // if Moth_Count = 5 -> reset and broadcast Trigger_Unicorn
  const eqMoth5 = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Moth_Count'], OPERAND2: ['num', 5] },
  })
  const setMoth0 = b.mk('data_setvariableto', {
    inputs: { VALUE: ['num', 0] },
    fields: { VARIABLE: ['var', 'Moth_Count'] },
  })
  const bcUni = b.mk('event_broadcast', {
    inputs: { BROADCAST_INPUT: ['broadcast', 'Trigger_Unicorn'] },
  })
  const ifMoth5 = b.mk('control_if', { inputs: { CONDITION: ['bool', eqMoth5] } })
  const ifMoth5Body = b.subStack([setMoth0, bcUni], ifMoth5)
  b.blocks[ifMoth5].inputs.SUBSTACK = [2, ifMoth5Body]

  const del1 = b.mk('control_delete_this_clone')
  const ifTouch = b.mk('control_if', { inputs: { CONDITION: ['bool', touching] } })
  const ifTouchBody = b.subStack([incScore, incMoth, ifMoth5, del1], ifTouch)
  b.blocks[ifTouch].inputs.SUBSTACK = [2, ifTouchBody]

  // if x < -240 -> delete
  const xPos = b.mk('motion_xposition')
  const ltX = b.mk('operator_lt', {
    inputs: { OPERAND1: ['rep', xPos], OPERAND2: ['num', -240] },
  })
  const del2 = b.mk('control_delete_this_clone')
  const ifOff = b.mk('control_if', { inputs: { CONDITION: ['bool', ltX] } })
  const ifOffBody = b.subStack([del2], ifOff)
  b.blocks[ifOff].inputs.SUBSTACK = [2, ifOffBody]

  const cFv = b.mk('control_forever')
  const cFvBody = b.subStack([cChangeX, ifTouch, ifOff], cFv)
  b.blocks[cFv].inputs.SUBSTACK = [2, cFvBody]

  b.script([cloneHat, cshow, cgoto, cFv])

  // flag clicked: hide
  const flagHide = b.mk('event_whenflagclicked')
  const fhHide = b.mk('looks_hide')
  b.script([flagHide, fhHide])

  return {
    isStage: false,
    name: 'Moth',
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: b.blocks,
    comments: {},
    currentCostume: 0,
    costumes: [makeCostume('Bogong_Moth', mothSvg, 16, 14)],
    sounds: [],
    volume: 100,
    layerOrder: layer,
    visible: false,
    x: 240,
    y: 0,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: "don't rotate",
  }
}

// ---------------- TARGET: Enemies/Obstacles ----------------
function buildEnemies(layer) {
  const b = makeBuilder()

  // when receive Start_Game: hide; forever: wait random 2-4, switch costume to random 1-5, create clone
  const hat = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Start_Game'] },
  })
  const hide = b.mk('looks_hide')

  const randWait = b.mk('operator_random', {
    inputs: { FROM: ['num', 2.0], TO: ['num', 4.0] },
  })
  const wait = b.mk('control_wait', { inputs: { DURATION: ['rep', randWait] } })
  const randCos = b.mk('operator_random', {
    inputs: { FROM: ['num', 1], TO: ['num', 5] },
  })
  const costumeShadow = shadowMenu(b, 'looks_costume', 'COSTUME', 'HardHat_Turtle')
  const switchCos = b.mk('looks_switchcostumeto', {
    inputs: { COSTUME: ['repShadow', randCos, costumeShadow] },
  })
  const cloneMenu = shadowMenu(b, 'control_create_clone_of_menu', 'CLONE_OPTION', '_myself_')
  const createClone = b.mk('control_create_clone_of', {
    inputs: { CLONE_OPTION: ['shadow', cloneMenu] },
  })
  const fv = b.mk('control_forever')
  const fvBody = b.subStack([wait, switchCos, createClone], fv)
  b.blocks[fv].inputs.SUBSTACK = [2, fvBody]
  b.script([hat, hide, fv])

  // when start as clone:
  // show; go to (240, -100); forever: change x by Scroll_Speed;
  //   if touching Snowpaw: if Unicorn_Mode = 1 -> Score +=2, delete clone; else broadcast Game_Over
  //   if x < -240 -> delete
  const cloneHat = b.mk('control_start_as_clone')
  const cshow = b.mk('looks_show')
  const cgoto = b.mk('motion_gotoxy', {
    inputs: { X: ['num', 240], Y: ['num', -100] },
  })
  const cChangeX = b.mk('motion_changexby', { inputs: { DX: ['var', 'Scroll_Speed'] } })

  const touchMenu = shadowMenu(b, 'sensing_touchingobjectmenu', 'TOUCHINGOBJECTMENU', 'Snowpaw')
  const touching = b.mk('sensing_touchingobject', {
    inputs: { TOUCHINGOBJECTMENU: ['shadow', touchMenu] },
  })

  const eqUni1 = b.mk('operator_equals', {
    inputs: { OPERAND1: ['var', 'Unicorn_Mode'], OPERAND2: ['num', 1] },
  })
  const inc2 = b.mk('data_changevariableby', {
    inputs: { VALUE: ['num', 2] },
    fields: { VARIABLE: ['var', 'Score'] },
  })
  const delClone = b.mk('control_delete_this_clone')
  const bcGO = b.mk('event_broadcast', {
    inputs: { BROADCAST_INPUT: ['broadcast', 'Game_Over'] },
  })
  const ifElseHit = b.mk('control_if_else', {
    inputs: { CONDITION: ['bool', eqUni1] },
  })
  const hitThen = b.subStack([inc2, delClone], ifElseHit)
  const hitElse = b.subStack([bcGO], ifElseHit)
  b.blocks[ifElseHit].inputs.SUBSTACK = [2, hitThen]
  b.blocks[ifElseHit].inputs.SUBSTACK2 = [2, hitElse]
  const ifTouch = b.mk('control_if', { inputs: { CONDITION: ['bool', touching] } })
  const ifTouchBody = b.subStack([ifElseHit], ifTouch)
  b.blocks[ifTouch].inputs.SUBSTACK = [2, ifTouchBody]

  const xPos = b.mk('motion_xposition')
  const ltX = b.mk('operator_lt', {
    inputs: { OPERAND1: ['rep', xPos], OPERAND2: ['num', -240] },
  })
  const del2 = b.mk('control_delete_this_clone')
  const ifOff = b.mk('control_if', { inputs: { CONDITION: ['bool', ltX] } })
  const ifOffBody = b.subStack([del2], ifOff)
  b.blocks[ifOff].inputs.SUBSTACK = [2, ifOffBody]

  const cFv = b.mk('control_forever')
  const cFvBody = b.subStack([cChangeX, ifTouch, ifOff], cFv)
  b.blocks[cFv].inputs.SUBSTACK = [2, cFvBody]

  b.script([cloneHat, cshow, cgoto, cFv])

  // flag clicked: hide
  const flagHide = b.mk('event_whenflagclicked')
  const fhHide = b.mk('looks_hide')
  b.script([flagHide, fhHide])

  return {
    isStage: false,
    name: 'Enemies',
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: b.blocks,
    comments: {},
    currentCostume: 0,
    costumes: [
      makeCostume('HardHat_Turtle', hardHatTurtle, 28, 22),
      makeCostume('Kangaroo_Vis', kangarooVis, 22, 32),
      makeCostume('DropBear_Hat', dropBearHat, 20, 20),
      makeCostume('Scaffolding', scaffolding, 30, 45),
      makeCostume('Resort_Building', resortBuilding, 42, 48),
    ],
    sounds: [],
    volume: 100,
    layerOrder: layer,
    visible: false,
    x: 240,
    y: -100,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: "don't rotate",
  }
}

// ---------------- TARGET: FactBubble ----------------
function buildFactBubble(layer) {
  const b = makeBuilder()

  // when flag clicked: hide; clear list; add 3 facts
  const flag = b.mk('event_whenflagclicked')
  const fhide = b.mk('looks_hide')
  const delAll = b.mk('data_deletealloflist', {
    fields: { LIST: ['list', 'Pygmy_Facts'] },
  })
  const fact1 = b.mk('data_addtolist', {
    inputs: { ITEM: ['str', 'Only ~2,000 Mountain Pygmy-possums remain in the wild!'] },
    fields: { LIST: ['list', 'Pygmy_Facts'] },
  })
  const fact2 = b.mk('data_addtolist', {
    inputs: { ITEM: ['str', "They are Australia's only hibernating marsupial!"] },
    fields: { LIST: ['list', 'Pygmy_Facts'] },
  })
  const fact3 = b.mk('data_addtolist', {
    inputs: { ITEM: ['str', 'Bogong moths are vital for their spring diet!'] },
    fields: { LIST: ['list', 'Pygmy_Facts'] },
  })
  b.script([flag, fhide, delAll, fact1, fact2, fact3])

  // when receive Show_Fact:
  //   go to (0, 120); show; say (item random of facts) for 4.5 secs; hide
  const hat = b.mk('event_whenbroadcastreceived', {
    fields: { BROADCAST_OPTION: ['broadcast', 'Show_Fact'] },
  })
  const goto = b.mk('motion_gotoxy', { inputs: { X: ['num', 0], Y: ['num', 120] } })
  const show = b.mk('looks_show')

  const len = b.mk('data_lengthoflist', { fields: { LIST: ['list', 'Pygmy_Facts'] } })
  const rand = b.mk('operator_random', {
    inputs: { FROM: ['num', 1], TO: ['rep', len] },
  })
  const item = b.mk('data_itemoflist', {
    inputs: { INDEX: ['rep', rand] },
    fields: { LIST: ['list', 'Pygmy_Facts'] },
  })
  const sayFor = b.mk('looks_sayforsecs', {
    inputs: { MESSAGE: ['repStr', item], SECS: ['num', 4.5] },
  })
  const hideEnd = b.mk('looks_hide')
  b.script([hat, goto, show, sayFor, hideEnd])

  return {
    isStage: false,
    name: 'FactBubble',
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: b.blocks,
    comments: {},
    currentCostume: 0,
    costumes: [makeCostume('Bubble_UI', bubble, 110, 45)],
    sounds: [],
    volume: 100,
    layerOrder: layer,
    visible: false,
    x: 0,
    y: 120,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: "don't rotate",
  }
}

// ---------------- Build & ZIP ----------------
const stage = buildStage()
const background = buildBackground(1)
const enemies = buildEnemies(2)
const moth = buildMoth(3)
const snowpaw = buildSnowpaw(4)
const factBubble = buildFactBubble(5)

const project = {
  targets: [stage, background, enemies, moth, snowpaw, factBubble],
  monitors: [],
  extensions: [],
  meta: {
    semver: '3.0.0',
    vm: '0.2.0',
    agent: 'Snowpaw Hero builder',
  },
}

const zip = new JSZip()
zip.file('project.json', JSON.stringify(project))
for (const [name, buf] of assetBuffers) {
  zip.file(name, buf)
}

const sb3Path = path.join(outDir, 'snowpaw-hero.sb3')
const buf = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
})
fs.writeFileSync(sb3Path, buf)

// Also write a copy of project.json for inspection / debugging
fs.writeFileSync(path.join(outDir, 'snowpaw-hero.project.json'), JSON.stringify(project, null, 2))

console.log(`[v0] wrote ${sb3Path} (${buf.length} bytes)`)
console.log(`[v0] targets: ${project.targets.length}, assets: ${assetBuffers.size}`)
