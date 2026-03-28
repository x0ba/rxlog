import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  patients: defineTable({
    name: v.string(),
    birthDate: v.string(),
    timezone: v.string(),
  }),

  medications: defineTable({
    patientId: v.id('patients'),
    name: v.string(),
    dosage: v.string(),
    scheduledTimes: v.array(v.number()),
    active: v.boolean(),
    catalogMedicationId: v.optional(v.id('medicationDatabase')),
  })
    .index('patientId', ['patientId'])
    .index('by_patientId_and_active', ['patientId', 'active']),

  users: defineTable({
    authIdentifier: v.string(),
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  })
    .index('by_authIdentifier', ['authIdentifier'])
    .index('by_clerkUserId', ['clerkUserId']),

  patientInvites: defineTable({
    patientId: v.id('patients'),
    email: v.string(),
    invitedBy: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
      v.literal('expired'),
    ),
    expiresAt: v.number(),
    token: v.string(),
  })
    .index('patientId', ['patientId'])
    .index('email', ['email'])
    .index('invitedBy', ['invitedBy'])
    .index('by_patientId_and_email', ['patientId', 'email']),

  patientMembers: defineTable({
    patientId: v.id('patients'),
    userId: v.id('users'),
    role: v.string(),
  })
    .index('patientId', ['patientId'])
    .index('userId', ['userId'])
    .index('patientId_userId', ['patientId', 'userId']),

  logs: defineTable({
    patientId: v.id('patients'),
    medicationId: v.id('medications'),
    loggedBy: v.id('users'),
    takenAt: v.number(),
    status: v.union(v.literal('taken'), v.literal('late'), v.literal('missed')),
    scheduledHour: v.number(),
    scheduledFor: v.number(),
    notes: v.optional(v.string()),
  })
    .index('patientId', ['patientId'])
    .index('loggedBy', ['loggedBy'])
    .index('patientId_loggedBy', ['patientId', 'loggedBy'])
    .index('by_patientId_and_scheduledFor', ['patientId', 'scheduledFor'])
    .index('by_patientId_and_medicationId_and_scheduledFor', [
      'patientId',
      'medicationId',
      'scheduledFor',
    ])
    .index('by_medicationId_and_scheduledFor', [
      'medicationId',
      'scheduledFor',
    ]),

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
