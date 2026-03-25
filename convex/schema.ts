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
  }).index('patientId', ['patientId']),
  
  users: defineTable({
    name: v.string(),
    email: v.string(),
  }),
  
  patientMembers: defineTable({
    patientId: v.id('patients'),
    userId: v.id('users'),
    role: v.string(),
  }).index('patientId', ['patientId']).index('userId', ['userId']),
  
  logs: defineTable({
    patientId: v.id('patients'),
    medicationId: v.id('medications'),
    loggedBy: v.id('users'),
    takenAt: v.number(),
    missed: v.boolean(),
    notes: v.optional(v.string()),
  }).index('patientId', ['patientId']).index('medicationId', ['medicationId']),

  medicationDatabase: defineTable({
    rxnorm_cui: v.string(),
    brand_name: v.string(),
    generic_name: v.string(),
    dosage_form: v.string(),
    strength: v.string(),
    route: v.string(),
    manufacturer: v.string(),
    ndc: v.string(),
    source: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('rxnorm_cui', ['rxnorm_cui']),

  medicationLabels: defineTable({
    medicationId: v.id('medicationDatabase'),
    indications: v.string(),
    warnings: v.string(),
    adverse_reactions: v.string(),
    contraindications: v.string(),
    raw_json: v.string(),
    updatedAt: v.number(),
  }).index('medicationId', ['medicationId']),
})
