import open3WayTables from '../assets/json/open_3way_tables.json'
import def3wVsOpenTables from '../assets/json/def_3w_vs_open_tables.json'
import def3wVsLimpTables from '../assets/json/def_3w_vs_limp_tables.json'
import callOpenShoveTables from '../assets/json/3w_call_open_shove_tables.json'
import huTables from '../assets/json/hu_tables.json'

export const BB_VALUES = [25, 20, 15, 10, 5]

export const ACTION_LABELS = {
  fold: 'Fold',
  check: 'Check',
  limp: 'Limp',
  open: 'Open',
  call: 'Call',
  shove: 'Shove',
  open_shove: 'Open shove',
  variable: 'Variable',
  '3bet_nai': '3bet non all-in',
  '3bet_ai': '3bet all-in',
  iso_nai: 'Iso non all-in',
  iso_ai: 'Iso all-in',
  iso_all_in: 'Iso all-in',
  iso_1_3_stack: 'Iso 1/3 stack',
  iso_size_value_call_all_in: 'Iso size value/call all-in',
  limp_fold: 'Limp/fold',
}

const ACTION_PRIORITY = [
  'fold',
  'check',
  'limp',
  'open',
  'call',
  'shove',
  'open_shove',
  '3bet_nai',
  '3bet_ai',
  'iso_nai',
  'iso_ai',
  'iso_all_in',
  'iso_1_3_stack',
  'iso_size_value_call_all_in',
  'limp_fold',
  'variable',
]

const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const RANK_VALUE = RANK_ORDER.reduce((acc, rank, index) => {
  acc[rank] = RANK_ORDER.length - index
  return acc
}, {})

const randomItem = (items) => items[Math.floor(Math.random() * items.length)]

const pickHandFrom = (hands, fallbackHands) => {
  if (hands.length > 0) return randomItem(hands)
  if (fallbackHands.length > 0) return randomItem(fallbackHands)
  return null
}

const buildAllHands = () => {
  const hands = []
  for (let i = 0; i < RANK_ORDER.length; i += 1) {
    for (let j = i; j < RANK_ORDER.length; j += 1) {
      const high = RANK_ORDER[i]
      const low = RANK_ORDER[j]
      if (i === j) {
        hands.push(`${high}${low}`)
      } else {
        hands.push(`${high}${low}s`)
        hands.push(`${high}${low}o`)
      }
    }
  }
  return hands
}

export const ALL_HANDS = buildAllHands()

export const SPOTS_3W = [
  {
    key: '3W_OPEN_BTN',
    format: '3W',
    label: 'Open 3Way BTN',
    heroPosition: 'BTN',
    previousActions: [],
    getTable: (effectiveBb) =>
      open3WayTables.tables.find((item) => item.position === 'BTN' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_OPEN_SB_BTN_FOLD',
    format: '3W',
    label: 'Open 3Way SB (BTN fold)',
    heroPosition: 'SB',
    previousActions: ['BTN: fold'],
    getTable: (effectiveBb) =>
      open3WayTables.tables.find((item) => item.position === 'SB' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_OPEN_BB_VS_BTN_OPEN',
    format: '3W',
    label: 'Def 3W vs OPEN: BB vs BTN open',
    heroPosition: 'BB',
    previousActions: ['BTN: open'],
    getTable: (effectiveBb) =>
      def3wVsOpenTables.tables.find(
        (item) =>
          item.hero_position === 'BB' &&
          item.effective_bb === effectiveBb &&
          typeof item.vs === 'string' &&
          item.vs.startsWith('BTN '),
      ),
  },
  {
    key: '3W_DEF_OPEN_SB_VS_BTN_OPEN',
    format: '3W',
    label: 'Def 3W vs OPEN: SB vs BTN open',
    heroPosition: 'SB',
    previousActions: ['BTN: open'],
    getTable: (effectiveBb) =>
      def3wVsOpenTables.tables.find(
        (item) =>
          item.hero_position === 'SB' &&
          item.effective_bb === effectiveBb &&
          typeof item.vs === 'string' &&
          item.vs.startsWith('BTN '),
      ),
  },
  {
    key: '3W_DEF_OPEN_BB_VS_SB_OPEN',
    format: '3W',
    label: 'Def 3W vs OPEN: BB vs SB open',
    heroPosition: 'BB',
    previousActions: ['BTN: fold', 'SB: open'],
    getTable: (effectiveBb) =>
      def3wVsOpenTables.tables.find(
        (item) =>
          item.hero_position === 'BB' &&
          item.effective_bb === effectiveBb &&
          typeof item.vs === 'string' &&
          item.vs.startsWith('SB '),
      ),
  },
  {
    key: '3W_DEF_OPEN_BB_VS_BU_OPEN_SB_CALL',
    format: '3W',
    label: 'Def 3W vs OPEN: BB vs BU open + SB call',
    heroPosition: 'BB',
    previousActions: ['BTN: open', 'SB: call'],
    getTable: (effectiveBb) =>
      def3wVsOpenTables.tables.find(
        (item) =>
          item.hero_position === 'BB' &&
          item.effective_bb === effectiveBb &&
          typeof item.vs === 'string' &&
          item.vs.startsWith('Open BU + Call SB '),
      ),
  },
  {
    key: '3W_DEF_LIMP_BB_VS_BTN_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: BB vs BTN limp',
    heroPosition: 'BB',
    previousActions: ['BTN: limp', 'SB: fold'],
    getTable: (effectiveBb) =>
      def3wVsLimpTables.tables.find((item) => item.spot === 'bb_vs_btn_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_LIMP_SB_VS_BTN_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: SB vs BTN limp',
    heroPosition: 'SB',
    previousActions: ['BTN: limp'],
    getTable: (effectiveBb) =>
      def3wVsLimpTables.tables.find((item) => item.spot === 'sb_vs_btn_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_LIMP_BB_VS_SB_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: BB vs SB limp',
    heroPosition: 'BB',
    previousActions: ['BTN: fold', 'SB: limp'],
    getTable: (effectiveBb) =>
      def3wVsLimpTables.tables.find((item) => item.spot === 'bb_vs_sb_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_LIMP_BB_VS_DOUBLE_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: BB vs double limp',
    heroPosition: 'BB',
    previousActions: ['BTN: limp', 'SB: limp'],
    getTable: (effectiveBb) =>
      def3wVsLimpTables.tables.find((item) => item.spot === 'bb_vs_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_SB_VS_BTN',
    format: '3W',
    label: '3W CALL OPEN SHOVE: SB vs BTN',
    heroPosition: 'SB',
    previousActions: ['BTN: shove'],
    getTable: (effectiveBb) =>
      callOpenShoveTables.tables.find(
        (item) => item.position === 'SB' && item.spot_id === 'sb_vs_btn' && item.effective_bb === effectiveBb,
      ),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_BB_VS_BTN',
    format: '3W',
    label: '3W CALL OPEN SHOVE: BB vs BTN',
    heroPosition: 'BB',
    previousActions: ['BTN: shove', 'SB: fold'],
    getTable: (effectiveBb) =>
      callOpenShoveTables.tables.find(
        (item) => item.position === 'BB' && item.spot_id === 'bb_vs_btn' && item.effective_bb === effectiveBb,
      ),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_BB_VS_SB',
    format: '3W',
    label: '3W CALL OPEN SHOVE: BB vs SB',
    heroPosition: 'BB',
    previousActions: ['BTN: fold', 'SB: shove'],
    getTable: (effectiveBb) =>
      callOpenShoveTables.tables.find(
        (item) => item.position === 'BB' && item.spot_id === 'bb_vs_sb' && item.effective_bb === effectiveBb,
      ),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_BB_VS_2_SHOVE',
    format: '3W',
    label: '3W CALL OPEN SHOVE: BB vs 2 shove',
    heroPosition: 'BB',
    previousActions: ['BTN: shove', 'SB: shove'],
    getTable: (effectiveBb) =>
      callOpenShoveTables.tables.find(
        (item) => item.position === 'BB' && item.spot_id === 'bb_vs_2_shove' && item.effective_bb === effectiveBb,
      ),
  },
]

export const SPOTS_HU = [
  {
    key: 'HU_BTN_SB_OPEN',
    format: 'HU',
    label: 'HU BTN/SB OPEN',
    heroPosition: 'BTN/SB',
    previousActions: [],
    getTable: (effectiveBb) =>
      huTables.tables.find((item) => item.scenario === 'BTN_SB_OPEN' && item.effective_bb === effectiveBb),
  },
  {
    key: 'HU_BB_VS_OPEN',
    format: 'HU',
    label: 'HU BB vs OPEN',
    heroPosition: 'BB',
    previousActions: ['BTN/SB: open'],
    getTable: (effectiveBb) =>
      huTables.tables.find((item) => item.scenario === 'BB_vs_OPEN' && item.effective_bb === effectiveBb),
  },
  {
    key: 'HU_BB_VS_LIMP',
    format: 'HU',
    label: 'HU BB vs LIMP',
    heroPosition: 'BB',
    previousActions: ['BTN/SB: limp'],
    getTable: (effectiveBb) =>
      huTables.tables.find((item) => item.scenario === 'BB_vs_LIMP' && item.effective_bb === effectiveBb),
  },
  {
    key: 'HU_CALL_OPEN_SHOVE',
    format: 'HU',
    label: 'HU CALL OPEN SHOVE',
    heroPosition: 'BB',
    previousActions: ['BTN/SB: shove'],
    getTable: (effectiveBb) =>
      huTables.tables.find((item) => item.scenario === 'CALL_OPEN_SHOVE' && item.effective_bb === effectiveBb),
  },
]

export const SPOTS_BY_FORMAT = {
  '3W': SPOTS_3W,
  HU: SPOTS_HU,
}

export const getSpotByKey = (spotKey) => {
  return [...SPOTS_3W, ...SPOTS_HU].find((spot) => spot.key === spotKey) ?? null
}

export const resolveSpotAndTable = ({ format, spotKey, effectiveBb }) => {
  const formatSpots = SPOTS_BY_FORMAT[format] ?? []
  const chosenSpot = spotKey === 'RANDOM' ? randomItem(formatSpots) : formatSpots.find((spot) => spot.key === spotKey)

  if (!chosenSpot) {
    return {
      status: 'error',
      message: 'Spot invalide pour ce format.',
    }
  }

  const table = chosenSpot.getTable(effectiveBb)
  if (!table) {
    return {
      status: 'missing',
      message: 'Table manquante pour ce spot / cette profondeur.',
      spot: chosenSpot,
    }
  }

  return {
    status: 'ok',
    spot: chosenSpot,
    table,
  }
}

export const getActionsFromGrid = (grid) => {
  const uniqueActions = [...new Set(Object.values(grid ?? {}))]
  uniqueActions.sort((a, b) => {
    const idxA = ACTION_PRIORITY.indexOf(a)
    const idxB = ACTION_PRIORITY.indexOf(b)
    if (idxA === -1 && idxB === -1) return a.localeCompare(b)
    if (idxA === -1) return 1
    if (idxB === -1) return -1
    return idxA - idxB
  })
  return uniqueActions
}

const handStrength = (hand) => {
  if (!hand || hand.length < 2) return 0
  const first = hand[0]
  const second = hand[1]
  const firstValue = RANK_VALUE[first] ?? 0
  const secondValue = RANK_VALUE[second] ?? 0

  if (hand.length === 2) {
    return 1000 + firstValue * 25
  }

  const suitedBonus = hand.endsWith('s') ? 20 : 0
  return firstValue * 22 + secondValue * 12 + suitedBonus
}

const weightedPoolForDifficulty = (grid, difficulty) => {
  const allHands = Object.keys(grid ?? {}).length > 0 ? Object.keys(grid) : ALL_HANDS
  const withAction = allHands.map((hand) => ({ hand, action: grid?.[hand] ?? 'fold' }))
  const nonFold = withAction.filter((item) => item.action !== 'fold')
  const variableHands = withAction.filter((item) => item.action === 'variable')

  const nonFoldSortedDesc = [...nonFold].sort((a, b) => handStrength(b.hand) - handStrength(a.hand))
  const nonFoldSortedAsc = [...nonFold].sort((a, b) => handStrength(a.hand) - handStrength(b.hand))

  const topChunkCount = Math.max(1, Math.ceil(nonFoldSortedDesc.length * 0.45))
  const bottomChunkCount = Math.max(1, Math.ceil(nonFoldSortedAsc.length * 0.45))

  const topNonFold = nonFoldSortedDesc.slice(0, topChunkCount).map((item) => item.hand)
  const bottomNonFold = nonFoldSortedAsc.slice(0, bottomChunkCount).map((item) => item.hand)
  const nonFoldHands = nonFold.map((item) => item.hand)
  const variablePool = variableHands.map((item) => item.hand)
  const allPool = allHands

  if (difficulty === 'easy') {
    if (Math.random() < 0.85) {
      return pickHandFrom(topNonFold, nonFoldHands)
    }
    return pickHandFrom(allPool, ALL_HANDS)
  }

  if (difficulty === 'hard') {
    if (Math.random() < 0.5 && variablePool.length > 0) {
      return pickHandFrom(variablePool, allPool)
    }

    if (Math.random() < 0.7) {
      return pickHandFrom(bottomNonFold, nonFoldHands)
    }

    return pickHandFrom(nonFoldHands, allPool)
  }

  if (Math.random() < 0.6) {
    return pickHandFrom(nonFoldHands, allPool)
  }
  return pickHandFrom(allPool, ALL_HANDS)
}

export const pickRandomHandForQuiz = ({ grid, difficulty }) => {
  return weightedPoolForDifficulty(grid, difficulty) ?? randomItem(ALL_HANDS)
}

export const formatActionLabel = (action) => ACTION_LABELS[action] ?? action
