import open3WayTablesRaw from '../assets/json/open_3way_tables.json'
import def3wVsOpenTablesRaw from '../assets/json/def_3w_vs_open_tables.json'
import def3wVsLimpTablesRaw from '../assets/json/def_3w_vs_limp_tables.json'
import callOpenShoveTablesRaw from '../assets/json/3w_call_open_shove_tables.json'
import huTablesRaw from '../assets/json/hu_tables.json'

export const PROFILE_OPTIONS = [
  { id: 'gto', label: 'Reg (GTO)', description: 'ranges theoriques' },
  { id: 'rec_passif', label: 'Recreatif passif', description: 'value/iso + tight vs shove' },
  { id: 'rec_aggro', label: 'Recreatif aggro', description: 'call plus vs shove, moins de limp' },
]

export const PROFILE_LABELS = PROFILE_OPTIONS.reduce((acc, item) => {
  acc[item.id] = item.label
  return acc
}, {})

export const DEFAULT_PROFILE = 'gto'
export const BB_VALUES = [25, 20, 15, 10, 5]

const PROFILE_SET = new Set(PROFILE_OPTIONS.map((item) => item.id))
const deepCopy = (value) => JSON.parse(JSON.stringify(value))

const pickExistingAction = (availableActions, options, fallback) => {
  for (const candidate of options) {
    if (availableActions.has(candidate)) return candidate
  }
  return availableActions.has(fallback) ? fallback : fallback
}

const inferCategory = (datasetKey, table) => {
  if (datasetKey === 'open3way') return 'open'
  if (datasetKey === 'def3wVsOpen') return 'vs_open'
  if (datasetKey === 'def3wVsLimp') return 'vs_limp'
  if (datasetKey === 'callOpenShove') return 'call_open_shove'

  if (datasetKey === 'hu') {
    if (table.scenario === 'BTN_SB_OPEN') return 'open'
    if (table.scenario === 'BB_vs_OPEN') return 'vs_open'
    if (table.scenario === 'BB_vs_LIMP') return 'vs_limp'
    if (table.scenario === 'CALL_OPEN_SHOVE') return 'call_open_shove'
  }

  return 'unknown'
}

const transformAction = ({ action, category, availableActions, profile }) => {
  if (profile === 'rec_passif') {
    if (category === 'call_open_shove' && action === 'variable') {
      return availableActions.has('fold') ? 'fold' : action
    }

    if (category === 'vs_open' && action === 'variable') {
      return availableActions.has('fold') ? 'fold' : action
    }

    if (category === 'vs_limp' && (action === 'check' || action === 'variable')) {
      if (availableActions.has('iso_nai')) return 'iso_nai'
    }

    if (action === 'variable') {
      return pickExistingAction(availableActions, ['open', 'iso_nai', 'call', 'variable'], action)
    }

    return action
  }

  if (profile === 'rec_aggro') {
    if (category === 'call_open_shove' && action === 'variable') {
      return availableActions.has('call') ? 'call' : action
    }

    if (category === 'vs_open' && action === 'variable') {
      return availableActions.has('call') ? 'call' : action
    }

    if (category === 'open' && action === 'limp') {
      return pickExistingAction(availableActions, ['open', 'open_shove', 'limp'], action)
    }

    return action
  }

  return action
}

const transformTablesForProfile = (dataset, profile) => {
  if (profile === 'gto') return dataset

  const next = deepCopy(dataset)
  const datasetKeys = ['open3way', 'def3wVsOpen', 'def3wVsLimp', 'callOpenShove', 'hu']

  for (const datasetKey of datasetKeys) {
    for (const table of next[datasetKey].tables) {
      const category = inferCategory(datasetKey, table)
      const availableActions = new Set(Object.values(table.grid ?? {}))

      for (const hand of Object.keys(table.grid ?? {})) {
        const originalAction = table.grid[hand]
        const transformed = transformAction({
          action: originalAction,
          category,
          availableActions,
          profile,
        })

        if (availableActions.has(transformed)) {
          table.grid[hand] = transformed
        } else if (availableActions.has('fold')) {
          table.grid[hand] = 'fold'
        }
      }
    }
  }

  return next
}

const gtoDataset = {
  open3way: deepCopy(open3WayTablesRaw),
  def3wVsOpen: deepCopy(def3wVsOpenTablesRaw),
  def3wVsLimp: deepCopy(def3wVsLimpTablesRaw),
  callOpenShove: deepCopy(callOpenShoveTablesRaw),
  hu: deepCopy(huTablesRaw),
}

const DATASETS_BY_PROFILE = {
  gto: gtoDataset,
  rec_passif: transformTablesForProfile(gtoDataset, 'rec_passif'),
  rec_aggro: transformTablesForProfile(gtoDataset, 'rec_aggro'),
}

export const normalizeProfile = (profile) => (PROFILE_SET.has(profile) ? profile : DEFAULT_PROFILE)

const randomItem = (items) => items[Math.floor(Math.random() * items.length)]

const SPOTS_3W = [
  {
    key: '3W_OPEN_BTN',
    format: '3W',
    label: 'Open 3Way BTN',
    heroPosition: 'BTN',
    previousActions: [],
    sourceLabel: 'Open 3Way',
    resolveTable: (dataset, effectiveBb) =>
      dataset.open3way.tables.find((item) => item.position === 'BTN' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_OPEN_SB_BTN_FOLD',
    format: '3W',
    label: 'Open 3Way SB (BTN fold)',
    heroPosition: 'SB',
    previousActions: ['BTN: fold'],
    sourceLabel: 'Open 3Way',
    resolveTable: (dataset, effectiveBb) =>
      dataset.open3way.tables.find((item) => item.position === 'SB' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_OPEN_BB_VS_BTN_OPEN',
    format: '3W',
    label: 'Def 3W vs OPEN: BB vs BTN open',
    heroPosition: 'BB',
    previousActions: ['BTN: open', 'SB: fold'],
    sourceLabel: 'Def 3W vs OPEN',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsOpen.tables.find(
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
    sourceLabel: 'Def 3W vs OPEN',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsOpen.tables.find(
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
    sourceLabel: 'Def 3W vs OPEN',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsOpen.tables.find(
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
    sourceLabel: 'Def 3W vs OPEN',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsOpen.tables.find(
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
    sourceLabel: 'Def 3W vs LIMP',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsLimp.tables.find((item) => item.spot === 'bb_vs_btn_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_LIMP_SB_VS_BTN_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: SB vs BTN limp',
    heroPosition: 'SB',
    previousActions: ['BTN: limp'],
    sourceLabel: 'Def 3W vs LIMP',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsLimp.tables.find((item) => item.spot === 'sb_vs_btn_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_LIMP_BB_VS_SB_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: BB vs SB limp',
    heroPosition: 'BB',
    previousActions: ['BTN: fold', 'SB: limp'],
    sourceLabel: 'Def 3W vs LIMP',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsLimp.tables.find((item) => item.spot === 'bb_vs_sb_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_DEF_LIMP_BB_VS_DOUBLE_LIMP',
    format: '3W',
    label: 'Def 3W vs LIMP: BB vs double limp',
    heroPosition: 'BB',
    previousActions: ['BTN: limp', 'SB: limp'],
    sourceLabel: 'Def 3W vs LIMP',
    resolveTable: (dataset, effectiveBb) =>
      dataset.def3wVsLimp.tables.find((item) => item.spot === 'bb_vs_limp' && item.effective_bb === effectiveBb),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_SB_VS_BTN',
    format: '3W',
    label: '3W CALL OPEN SHOVE: SB vs BTN',
    heroPosition: 'SB',
    previousActions: ['BTN: shove'],
    sourceLabel: '3W CALL OPEN SHOVE',
    resolveTable: (dataset, effectiveBb) =>
      dataset.callOpenShove.tables.find(
        (item) => item.position === 'SB' && item.spot_id === 'sb_vs_btn' && item.effective_bb === effectiveBb,
      ),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_BB_VS_BTN',
    format: '3W',
    label: '3W CALL OPEN SHOVE: BB vs BTN',
    heroPosition: 'BB',
    previousActions: ['BTN: shove', 'SB: fold'],
    sourceLabel: '3W CALL OPEN SHOVE',
    resolveTable: (dataset, effectiveBb) =>
      dataset.callOpenShove.tables.find(
        (item) => item.position === 'BB' && item.spot_id === 'bb_vs_btn' && item.effective_bb === effectiveBb,
      ),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_BB_VS_SB',
    format: '3W',
    label: '3W CALL OPEN SHOVE: BB vs SB',
    heroPosition: 'BB',
    previousActions: ['BTN: fold', 'SB: shove'],
    sourceLabel: '3W CALL OPEN SHOVE',
    resolveTable: (dataset, effectiveBb) =>
      dataset.callOpenShove.tables.find(
        (item) => item.position === 'BB' && item.spot_id === 'bb_vs_sb' && item.effective_bb === effectiveBb,
      ),
  },
  {
    key: '3W_CALL_OPEN_SHOVE_BB_VS_2_SHOVE',
    format: '3W',
    label: '3W CALL OPEN SHOVE: BB vs 2 shove',
    heroPosition: 'BB',
    previousActions: ['BTN: shove', 'SB: shove'],
    sourceLabel: '3W CALL OPEN SHOVE',
    resolveTable: (dataset, effectiveBb) =>
      dataset.callOpenShove.tables.find(
        (item) => item.position === 'BB' && item.spot_id === 'bb_vs_2_shove' && item.effective_bb === effectiveBb,
      ),
  },
]

const SPOTS_HU = [
  {
    key: 'HU_BTN_SB_OPEN',
    format: 'HU',
    label: 'HU BTN/SB OPEN',
    heroPosition: 'BTN/SB',
    previousActions: [],
    sourceLabel: 'HU',
    resolveTable: (dataset, effectiveBb) =>
      dataset.hu.tables.find((item) => item.scenario === 'BTN_SB_OPEN' && item.effective_bb === effectiveBb),
  },
  {
    key: 'HU_BB_VS_OPEN',
    format: 'HU',
    label: 'HU BB vs OPEN',
    heroPosition: 'BB',
    previousActions: ['BTN/SB: open'],
    sourceLabel: 'HU',
    resolveTable: (dataset, effectiveBb) =>
      dataset.hu.tables.find((item) => item.scenario === 'BB_vs_OPEN' && item.effective_bb === effectiveBb),
  },
  {
    key: 'HU_BB_VS_LIMP',
    format: 'HU',
    label: 'HU BB vs LIMP',
    heroPosition: 'BB',
    previousActions: ['BTN/SB: limp'],
    sourceLabel: 'HU',
    resolveTable: (dataset, effectiveBb) =>
      dataset.hu.tables.find((item) => item.scenario === 'BB_vs_LIMP' && item.effective_bb === effectiveBb),
  },
  {
    key: 'HU_CALL_OPEN_SHOVE',
    format: 'HU',
    label: 'HU CALL OPEN SHOVE',
    heroPosition: 'BB',
    previousActions: ['BTN/SB: shove'],
    sourceLabel: 'HU',
    resolveTable: (dataset, effectiveBb) =>
      dataset.hu.tables.find((item) => item.scenario === 'CALL_OPEN_SHOVE' && item.effective_bb === effectiveBb),
  },
]

export const SPOTS_BY_FORMAT = {
  '3W': SPOTS_3W,
  HU: SPOTS_HU,
}

const withCompletePreviousActions = (spot) => {
  if (!spot || spot.format !== '3W' || spot.heroPosition !== 'BB') return spot

  const parsed = {}
  for (const line of spot.previousActions ?? []) {
    const [positionRaw, actionRaw] = String(line).split(':')
    const position = positionRaw?.trim()
    const action = actionRaw?.trim()
    if (position && action) parsed[position] = action
  }

  if (!parsed.BTN) parsed.BTN = 'fold'
  if (!parsed.SB) parsed.SB = 'fold'

  return {
    ...spot,
    previousActions: [`BTN: ${parsed.BTN}`, `SB: ${parsed.SB}`],
  }
}

export const resolveSpotAndTable = ({ format, spotKey, effectiveBb, profile = DEFAULT_PROFILE }) => {
  const normalizedProfile = normalizeProfile(profile)
  const dataset = DATASETS_BY_PROFILE[normalizedProfile]
  const formatSpots = SPOTS_BY_FORMAT[format] ?? []
  const selectedSpot =
    spotKey === 'RANDOM' ? randomItem(formatSpots) : formatSpots.find((spot) => spot.key === spotKey)
  const spot = withCompletePreviousActions(selectedSpot)

  if (!spot) {
    return { status: 'error', message: 'Spot invalide pour ce format.' }
  }

  const table = spot.resolveTable(dataset, effectiveBb)
  if (!table) {
    return { status: 'missing', message: 'Table manquante pour ce spot / cette profondeur.', spot, profile: normalizedProfile }
  }

  return {
    status: 'ok',
    spot,
    table,
    source: spot.sourceLabel,
    profile: normalizedProfile,
  }
}

export const getAction = ({ format, spotKey, effectiveBb, handCode, profile = DEFAULT_PROFILE }) => {
  const resolved = resolveSpotAndTable({ format, spotKey, effectiveBb, profile })
  if (resolved.status !== 'ok') return resolved

  const action = resolved.table?.grid?.[handCode]
  if (!action) {
    return {
      status: 'missing_hand',
      message: `Main ${handCode} absente de la table.`,
      spot: resolved.spot,
      source: resolved.source,
      profile: resolved.profile,
    }
  }

  return {
    status: 'ok',
    action,
    spot: resolved.spot,
    source: resolved.source,
    profile: resolved.profile,
  }
}

export const resolveSelectionContextToLookup = (decisionContext) => {
  if (!decisionContext || decisionContext.status !== 'ready') return null

  if (decisionContext.mode === 'hu') {
    const scenarioMap = {
      BTN_SB_OPEN: 'HU_BTN_SB_OPEN',
      BB_vs_OPEN: 'HU_BB_VS_OPEN',
      BB_vs_LIMP: 'HU_BB_VS_LIMP',
      CALL_OPEN_SHOVE: 'HU_CALL_OPEN_SHOVE',
    }
    const spotKey = scenarioMap[decisionContext.scenario]
    return spotKey ? { format: 'HU', spotKey } : null
  }

  if (decisionContext.mode === 'open_3way') {
    if (decisionContext.tablePosition === 'BTN') return { format: '3W', spotKey: '3W_OPEN_BTN' }
    if (decisionContext.tablePosition === 'SB') return { format: '3W', spotKey: '3W_OPEN_SB_BTN_FOLD' }
    return null
  }

  if (decisionContext.mode === 'bb_vs_open') {
    const keyMap = {
      BTN_OPEN: '3W_DEF_OPEN_BB_VS_BTN_OPEN',
      SB_OPEN: '3W_DEF_OPEN_BB_VS_SB_OPEN',
      BTN_OPEN_SB_CALL: '3W_DEF_OPEN_BB_VS_BU_OPEN_SB_CALL',
    }
    const spotKey = keyMap[decisionContext.key]
    return spotKey ? { format: '3W', spotKey } : null
  }

  if (decisionContext.mode === 'sb_vs_open') return { format: '3W', spotKey: '3W_DEF_OPEN_SB_VS_BTN_OPEN' }

  if (decisionContext.mode === 'bb_vs_limp') {
    const keyMap = {
      bb_vs_btn_limp: '3W_DEF_LIMP_BB_VS_BTN_LIMP',
      bb_vs_sb_limp: '3W_DEF_LIMP_BB_VS_SB_LIMP',
      bb_vs_limp: '3W_DEF_LIMP_BB_VS_DOUBLE_LIMP',
    }
    const spotKey = keyMap[decisionContext.key]
    return spotKey ? { format: '3W', spotKey } : null
  }

  if (decisionContext.mode === 'sb_vs_limp') return { format: '3W', spotKey: '3W_DEF_LIMP_SB_VS_BTN_LIMP' }

  if (decisionContext.mode === 'bb_vs_shove') {
    const keyMap = {
      bb_vs_btn: '3W_CALL_OPEN_SHOVE_BB_VS_BTN',
      bb_vs_sb: '3W_CALL_OPEN_SHOVE_BB_VS_SB',
      bb_vs_2_shove: '3W_CALL_OPEN_SHOVE_BB_VS_2_SHOVE',
    }
    const spotKey = keyMap[decisionContext.key]
    return spotKey ? { format: '3W', spotKey } : null
  }

  if (decisionContext.mode === 'sb_vs_shove') return { format: '3W', spotKey: '3W_CALL_OPEN_SHOVE_SB_VS_BTN' }
  if (decisionContext.mode === 'bb_vs_sb_equivalent_shove') return { format: '3W', spotKey: '3W_CALL_OPEN_SHOVE_SB_VS_BTN' }

  return null
}

const runProfileSanityChecks = () => {
  const sampleSpot = '3W_DEF_OPEN_BB_VS_BTN_OPEN'
  const sampleBb = 25
  const variableHand = Object.entries(
    resolveSpotAndTable({ format: '3W', spotKey: sampleSpot, effectiveBb: sampleBb, profile: 'gto' }).table?.grid ?? {},
  ).find(([, value]) => value === 'variable')?.[0]

  if (variableHand) {
    const gto = getAction({ format: '3W', spotKey: sampleSpot, effectiveBb: sampleBb, handCode: variableHand, profile: 'gto' })
    const passif = getAction({ format: '3W', spotKey: sampleSpot, effectiveBb: sampleBb, handCode: variableHand, profile: 'rec_passif' })
    const aggro = getAction({ format: '3W', spotKey: sampleSpot, effectiveBb: sampleBb, handCode: variableHand, profile: 'rec_aggro' })
    console.log('[ranges-check] vs_open variable sample', { hand: variableHand, gto: gto.action, passif: passif.action, aggro: aggro.action })
  }

  const shoveSpot = 'HU_CALL_OPEN_SHOVE'
  const shoveHand = Object.entries(
    resolveSpotAndTable({ format: 'HU', spotKey: shoveSpot, effectiveBb: 20, profile: 'gto' }).table?.grid ?? {},
  ).find(([, value]) => value === 'variable')?.[0]

  if (shoveHand) {
    const passif = getAction({ format: 'HU', spotKey: shoveSpot, effectiveBb: 20, handCode: shoveHand, profile: 'rec_passif' })
    const aggro = getAction({ format: 'HU', spotKey: shoveSpot, effectiveBb: 20, handCode: shoveHand, profile: 'rec_aggro' })
    console.log('[ranges-check] call_shove variable sample', { hand: shoveHand, passif: passif.action, aggro: aggro.action })
  }
}

if (typeof window !== 'undefined') {
  runProfileSanityChecks()
}
