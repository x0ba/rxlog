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
})
