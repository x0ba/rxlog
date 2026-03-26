import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  patients: defineTable({
    name: v.string(),
    birthDate: v.string(),
  }),

  medications: defineTable({
    patientId: v.id('patients'),
    name: v.string(),
    dosage: v.string(),
    scheduledTimes: v.array(v.number()),
    active: v.boolean(),
    catalogMedicationId: v.optional(v.id('medicationDatabase')),
  }).index('patientId', ['patientId']),

  users: defineTable({
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  }).index('clerkId', ['clerkId']),

  patientMembers: defineTable({
    patientId: v.id('patients'),
    userId: v.id('users'),
    role: v.string(),
  })
    .index('patientId', ['patientId'])
    .index('userId', ['userId']),

  logs: defineTable({
    patientId: v.id('patients'),
    medicationId: v.id('medications'),
    loggedBy: v.id('users'),
    takenAt: v.number(),
    missed: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index('patientId', ['patientId'])
    .index('medicationId', ['medicationId']),

  medicationDatabase: defineTable({
    rxnormCui: v.string(),
    displayName: v.string(),
    brandName: v.string(),
    genericName: v.string(),
    dosageForm: v.string(),
    strength: v.string(),
    route: v.string(),
    manufacturer: v.string(),
    ndc: v.string(),
    source: v.string(),
    searchText: v.string(),
    lastFetchedAt: v.number(),
  }).index('rxnormCui', ['rxnormCui']),

  medicationLabels: defineTable({
    medicationId: v.id('medicationDatabase'),
    indications: v.string(),
    warnings: v.string(),
    adverseReactions: v.string(),
    contraindications: v.string(),
    source: v.string(),
    sourceId: v.string(),
    lastFetchedAt: v.number(),
    staleAt: v.number(),
  }).index('medicationId', ['medicationId']),
})
