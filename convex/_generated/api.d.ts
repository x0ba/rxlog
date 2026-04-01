/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as logs from "../logs.js";
import type * as medicationCatalog from "../medicationCatalog.js";
import type * as medications from "../medications.js";
import type * as patientMembers from "../patientMembers.js";
import type * as patients from "../patients.js";
import type * as timezone from "../timezone.js";
import type * as userSync from "../userSync.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  invites: typeof invites;
  logs: typeof logs;
  medicationCatalog: typeof medicationCatalog;
  medications: typeof medications;
  patientMembers: typeof patientMembers;
  patients: typeof patients;
  timezone: typeof timezone;
  userSync: typeof userSync;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
