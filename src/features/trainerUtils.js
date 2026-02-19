import { BB_VALUES, SPOTS_BY_FORMAT, resolveSpotAndTable } from '../ranges'

export { BB_VALUES, SPOTS_BY_FORMAT, resolveSpotAndTable }

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
    if (Math.random() < 0.85) return pickHandFrom(topNonFold, nonFoldHands)
    return pickHandFrom(allPool, ALL_HANDS)
  }

  if (difficulty === 'hard') {
    if (Math.random() < 0.5 && variablePool.length > 0) return pickHandFrom(variablePool, allPool)
    if (Math.random() < 0.7) return pickHandFrom(bottomNonFold, nonFoldHands)
    return pickHandFrom(nonFoldHands, allPool)
  }

  if (Math.random() < 0.6) return pickHandFrom(nonFoldHands, allPool)
  return pickHandFrom(allPool, ALL_HANDS)
}

export const pickRandomHandForQuiz = ({ grid, difficulty }) => {
  return weightedPoolForDifficulty(grid, difficulty) ?? randomItem(ALL_HANDS)
}

export const formatActionLabel = (action) => ACTION_LABELS[action] ?? action
