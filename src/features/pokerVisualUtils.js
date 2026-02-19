const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']

const RANK_MAP = {
  A: 'A',
  K: 'K',
  Q: 'Q',
  J: 'J',
  T: 'T',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
}

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)]

const pickTwoDifferentSuits = () => {
  const first = pickRandom(SUITS)
  const remaining = SUITS.filter((suit) => suit !== first)
  const second = pickRandom(remaining)
  return [first, second]
}

export const actionToShort = (action) => {
  const normalized = String(action || '').toLowerCase()
  if (!normalized) return '-'
  if (normalized.includes('fold')) return 'F'
  if (normalized.includes('shove') || normalized.includes('all-in') || normalized === 'ai') return 'AI'
  if (normalized.includes('raise') || normalized.includes('3bet') || normalized.includes('iso')) return 'R'
  if (normalized.includes('open')) return 'O'
  if (normalized.includes('limp')) return 'L'
  if (normalized.includes('call')) return 'C'
  if (normalized.includes('check')) return 'X'
  if (normalized.includes('variable')) return 'V'
  return normalized.slice(0, 1).toUpperCase()
}

export const parsePreviousActions = (previousActions) => {
  if (!Array.isArray(previousActions)) return []

  return previousActions
    .map((entry) => {
      const [positionRaw, actionRaw] = String(entry).split(':')
      const position = positionRaw?.trim()
      const action = actionRaw?.trim()
      if (!position || !action) return null
      return { position, action }
    })
    .filter(Boolean)
}

export const buildActionMap = (question) => {
  const parsed = parsePreviousActions(question?.previousActions)
  return parsed.reduce((acc, item) => {
    acc[item.position] = item.action
    return acc
  }, {})
}

export const getCenterPotVisual = (question) => {
  const parsed = parsePreviousActions(question?.previousActions)
  const actions = parsed.map((item) => String(item.action || '').toLowerCase())

  const contains = (matcher) => actions.some((action) => matcher(action))

  if (contains((a) => a.includes('shove') || a.includes('all-in') || a === 'ai')) {
    return { label: 'ALL-IN', tone: 'danger' }
  }

  if (contains((a) => a.includes('raise') || a.includes('open') || a.includes('3bet') || a.includes('iso'))) {
    return { label: '2bb', tone: 'raise' }
  }

  if (contains((a) => a.includes('limp') || a.includes('call'))) {
    return { label: '1bb', tone: 'passive' }
  }

  return { label: 'POT', tone: 'neutral' }
}

export const handCodeToTwoCards = (handCode) => {
  const code = String(handCode || '').toUpperCase().trim()
  if (!code || code.length < 2) return []

  const rankA = RANK_MAP[code[0]]
  const rankB = RANK_MAP[code[1]]
  if (!rankA || !rankB) return []

  if (code.length === 2) {
    const [suitA, suitB] = pickTwoDifferentSuits()
    return [
      { rank: rankA, suit: suitA },
      { rank: rankB, suit: suitB },
    ]
  }

  const suitedFlag = code[2]
  if (suitedFlag === 'S') {
    const sameSuit = pickRandom(SUITS)
    return [
      { rank: rankA, suit: sameSuit },
      { rank: rankB, suit: sameSuit },
    ]
  }

  const [suitA, suitB] = pickTwoDifferentSuits()
  return [
    { rank: rankA, suit: suitA },
    { rank: rankB, suit: suitB },
  ]
}
