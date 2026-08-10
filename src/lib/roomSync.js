// src/lib/roomSync.js
// -----------------------------------------------------------------------
// Syncs an open-play queue session across devices using Firebase Realtime
// Database. No custom server — just a free Firebase project.
//
// SECURITY RULES (Realtime Database -> Rules tab). Make sure these are
// published so reads/writes to a room actually work:
//   {
//     "rules": {
//       "rooms": {
//         "$code": {
//           ".read": true,
//           ".write": true
//         }
//       }
//     }
//   }
// This keeps things simple (no login for players) at the cost of anyone
// with a room code being able to read/write that room only — fine for a
// live open-play session that gets closed at the end of the day.
// -----------------------------------------------------------------------

import { initializeApp, getApps } from 'firebase/app'
import {
  getDatabase, ref, set, onValue, push, remove, off, get, serverTimestamp,
} from 'firebase/database'

export const QUEUE_ROOM_TTL_MS = 12 * 60 * 60 * 1000

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA0RvDvB3uU3KRaeU0I7c43ZM9SwMw-FYQ',
  authDomain: 'picklebook-659d3.firebaseapp.com',
  databaseURL: 'https://picklebook-659d3-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'picklebook-659d3',
}

function app() {
  return getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG)
}

function db() {
  return getDatabase(app())
}

function isExpiredState(state) {
  const expiresAt = Number(state?.meta?.expiresAt || 0)
  return expiresAt > 0 && Date.now() > expiresAt
}

export function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // skips 0/O/1/I — easy to read aloud
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ---- host side ----------------------------------------------------------

/** Host calls this every time local players/courts change. */
export function publishState(code, players, courts, meta = {}) {
  return set(ref(db(), `rooms/${code}/state`), {
    players,
    courts,
    meta: {
      ...meta,
      expiresAt: meta.expiresAt || Date.now() + QUEUE_ROOM_TTL_MS,
    },
    updatedAt: serverTimestamp(),
  })
}

/** Host subscribes to incoming join requests from players' phones. */
export function subscribeJoinRequests(code, callback) {
  const reqRef = ref(db(), `rooms/${code}/joinRequests`)
  const handler = snap => {
    const val = snap.val() || {}
    callback(Object.entries(val).map(([id, r]) => ({ id, ...r })))
  }
  onValue(reqRef, handler)
  return () => off(reqRef, 'value', handler)
}

/** Host calls this once a join request has been added to the local queue. */
export function clearJoinRequest(code, requestId) {
  return remove(ref(db(), `rooms/${code}/joinRequests/${requestId}`))
}

/** Host calls this when ending the join session (deletes the room). */
export function closeRoom(code) {
  return remove(ref(db(), `rooms/${code}`))
}

// ---- player side ----------------------------------------------------------

/** Player's device subscribes to the live, read-only queue state. */
export function subscribeRoomState(code, callback) {
  const stateRef = ref(db(), `rooms/${code}/state`)
  const handler = snap => {
    const state = snap.val()
    if (isExpiredState(state)) {
      remove(ref(db(), `rooms/${code}`)).catch(() => {})
      callback(null)
      return
    }
    callback(state)
  }
  onValue(stateRef, handler)
  return () => off(stateRef, 'value', handler)
}

export async function roomExists(code) {
  const snap = await get(ref(db(), `rooms/${code}/state`))
  if (!snap.exists()) return false
  const state = snap.val()
  if (isExpiredState(state)) {
    await remove(ref(db(), `rooms/${code}`)).catch(() => {})
    return false
  }
  return true
}

/** Player submits their name — host will pick this up and add them. */
export async function submitJoinRequest(code, { name, skill, profileImageUrl }) {
  const exists = await roomExists(code)
  if (!exists) throw new Error('Queue room is closed or expired.')
  const reqRef = push(ref(db(), `rooms/${code}/joinRequests`))
  await set(reqRef, { name, skill, profileImageUrl: profileImageUrl || null, requestedAt: Date.now() })
  return reqRef.key
}
