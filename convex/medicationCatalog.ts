import { v } from 'convex/values'
import { internal } from './_generated/api'
import { action, internalMutation } from './_generated/server'

type RxNormConcept = {
  rxcui?: string
  name?: string
  synonym?: string
  tty?: string
}

type RxNormGroup = {
  tty?: string
  conceptProperties?: Array<RxNormConcept>
}

type RxNormDrugsResponse = {
  drugGroup?: {
    conceptGroup?: Array<RxNormGroup>
  }
}

type NormalizedRxNormConcept = RxNormConcept & {
  rxcui: string
  name: string
  tty: string
}

type MedicineSearchResult = {
  medicationDatabaseId: string
  rxnormCui: string
  displayName: string
  brandName: string
  genericName: string
  dosageForm: string
  strength: string
  route: string
  source: 'rxnorm'
  suggestedDosage: string
  suggestedScheduledTimes: Array<number>
  suggestionReason: string
}

const RXNAV_BASE_URL = 'https://rxnav.nlm.nih.gov/REST'
const MAX_QUERY_LENGTH = 80
const DEFAULT_LIMIT = 8

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH)
}

function inferStrength(name: string) {
  const match = name.match(
    /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|units?|iu|%)\b(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mL|units?|iu|%))?/i,
  )
  return match?.[0] ?? ''
}

function inferDosageForm(name: string, tty: string) {
  const lowerName = name.toLowerCase()
  const form = [
    'tablet',
    'capsule',
    'solution',
    'suspension',
    'injection',
    'spray',
    'cream',
    'ointment',
    'patch',
    'gel',
    'drops',
    'powder',
  ].find((candidate) => lowerName.includes(candidate))

  return form ?? tty
}

function inferRoute(name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('oral')) return 'oral'
  if (lowerName.includes('topical')) return 'topical'
  if (lowerName.includes('injection') || lowerName.includes('injectable')) {
    return 'injection'
  }
  if (lowerName.includes('nasal')) return 'nasal'
  if (lowerName.includes('ophthalmic')) return 'ophthalmic'
  if (lowerName.includes('otic')) return 'otic'
  return ''
}

function inferScheduledTimes(name: string) {
  const lowerName = name.toLowerCase()

  if (/\b(bedtime|nightly|at night)\b/.test(lowerName)) {
    return {
      times: [21],
      reason: 'Nightly schedule phrase found in RxNorm name metadata.',
    }
  }
  if (/\b(twice daily|bid|every 12 hours|q12h)\b/.test(lowerName)) {
    return {
      times: [8, 20],
      reason: 'Twice-daily schedule phrase found in RxNorm name metadata.',
    }
  }
  if (/\b(three times daily|tid|every 8 hours|q8h)\b/.test(lowerName)) {
    return {
      times: [8, 14, 20],
      reason:
        'Three-times-daily schedule phrase found in RxNorm name metadata.',
    }
  }
  if (/\b(four times daily|qid|every 6 hours|q6h)\b/.test(lowerName)) {
    return {
      times: [6, 12, 18, 22],
      reason: 'Four-times-daily schedule phrase found in RxNorm name metadata.',
    }
  }

  return {
    times: [8],
    reason:
      'RxNorm does not provide patient-specific times, so RxLog suggested a conservative once-daily morning default. Confirm with the prescription label.',
  }
}

function cleanRxNormName(name: string) {
  return name
    .replace(/^\{\d+\s*\((.*)\)\s*\}\s*Pack(?:\s*\[(.*)\])?$/i, '$2 Pack')
    .replace(/^\{.*\}\s*Pack\s*\[(.*)\]$/i, '$1 Pack')
    .replace(/\s+/g, ' ')
    .trim()
}

function getBrandFromName(name: string) {
  const match = name.match(/\[([^\]]+)\]/)
  return match?.[1] ?? ''
}

function getBrandName(concept: RxNormConcept) {
  if (concept.tty === 'SBD' || concept.tty === 'BN') {
    return (
      getBrandFromName(concept.name ?? '') ||
      cleanRxNormName(concept.name ?? '')
    )
  }
  return ''
}

function getGenericName(concept: RxNormConcept) {
  if (concept.tty === 'SCD' || concept.tty === 'IN') {
    return cleanRxNormName(concept.name ?? '')
  }
  return ''
}

function getSearchPriority(concept: NormalizedRxNormConcept, query: string) {
  const ttyPriority: Record<string, number> = {
    SBD: 0,
    SCD: 1,
    BN: 2,
    IN: 3,
    MIN: 4,
    BPCK: 8,
    GPCK: 9,
  }
  const cleanedName = cleanRxNormName(concept.name).toLowerCase()
  const queryIndex = cleanedName.indexOf(query.toLowerCase())
  const packPenalty = /\{.*\}\s*pack/i.test(concept.name) ? 8 : 0
  const queryPenalty = queryIndex === -1 ? 2 : Math.min(queryIndex / 20, 2)

  return (ttyPriority[concept.tty] ?? 5) + packPenalty + queryPenalty
}

export const cacheSearchResults = internalMutation({
  args: {
    results: v.array(
      v.object({
        rxnormCui: v.string(),
        displayName: v.string(),
        brandName: v.string(),
        genericName: v.string(),
        dosageForm: v.string(),
        strength: v.string(),
        route: v.string(),
        source: v.string(),
        searchText: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const cached = []

    for (const result of args.results) {
      const existing = await ctx.db
        .query('medicationDatabase')
        .withIndex('rxnormCui', (q) => q.eq('rxnormCui', result.rxnormCui))
        .unique()

      if (existing) {
        await ctx.db.patch('medicationDatabase', existing._id, {
          ...result,
          lastFetchedAt: now,
        })
        cached.push({ ...result, medicationDatabaseId: existing._id })
      } else {
        const medicationDatabaseId = await ctx.db.insert('medicationDatabase', {
          ...result,
          manufacturer: '',
          ndc: '',
          lastFetchedAt: now,
        })
        cached.push({ ...result, medicationDatabaseId })
      }
    }

    return cached
  },
})

export const searchMedicines = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Array<MedicineSearchResult>> => {
    const query = normalizeSearchQuery(args.query)
    const limit = Math.min(Math.max(args.limit ?? DEFAULT_LIMIT, 1), 10)

    if (query.length < 2) return []

    const response = await fetch(
      `${RXNAV_BASE_URL}/drugs.json?name=${encodeURIComponent(query)}`,
      { headers: { accept: 'application/json' } },
    )

    if (!response.ok) {
      throw new Error('Unable to search RxNorm medicines right now')
    }

    const data = (await response.json()) as RxNormDrugsResponse
    const groups = data.drugGroup?.conceptGroup ?? []
    const concepts = groups
      .flatMap((group) =>
        (group.conceptProperties ?? []).map((concept) => ({
          ...concept,
          tty: concept.tty ?? group.tty ?? '',
        })),
      )
      .filter((concept): concept is NormalizedRxNormConcept =>
        Boolean(concept.rxcui && concept.name),
      )

    const deduped = new Map<string, NormalizedRxNormConcept>()
    for (const concept of concepts) {
      if (!deduped.has(concept.rxcui)) deduped.set(concept.rxcui, concept)
    }

    const normalizedResults = [...deduped.values()]
      .sort(
        (left, right) =>
          getSearchPriority(left, query) - getSearchPriority(right, query),
      )
      .map((concept) => {
        const displayName = cleanRxNormName(concept.name)
        const strength = inferStrength(concept.name)
        return {
          rxnormCui: concept.rxcui,
          displayName,
          brandName: getBrandName(concept),
          genericName: getGenericName(concept),
          dosageForm: inferDosageForm(concept.name, concept.tty),
          strength,
          route: inferRoute(concept.name),
          source: 'rxnorm',
          searchText:
            `${displayName} ${concept.name} ${concept.synonym ?? ''} ${query}`.toLowerCase(),
        }
      })

    const cached = await ctx.runMutation(
      internal.medicationCatalog.cacheSearchResults,
      {
        results: normalizedResults,
      },
    )

    return cached.slice(0, limit).map((result) => {
      const schedule = inferScheduledTimes(result.displayName)
      return {
        ...result,
        source: 'rxnorm',
        suggestedDosage: result.strength,
        suggestedScheduledTimes: schedule.times,
        suggestionReason: schedule.reason,
      }
    })
  },
})
