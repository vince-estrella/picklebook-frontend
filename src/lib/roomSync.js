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

export function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // skips 0/O/1/I — easy to read aloud
  let code = ''
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// ---- host side ----------------------------------------------------------

/** Host calls this every time local players/courts change. */
export function publishState(code, players, courts) {
  return set(ref(db(), `rooms/${code}/state`), {
    players, courts, updatedAt: serverTimestamp(),
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
  const handler = snap => callback(snap.val())
  onValue(stateRef, handler)
  return () => off(stateRef, 'value', handler)
}

export async function roomExists(code) {
  const snap = await get(ref(db(), `rooms/${code}/state`))
  return snap.exists()
}

/** Player submits their name — host will pick this up and add them. */
export async function submitJoinRequest(code, { name, skill }) {
  const reqRef = push(ref(db(), `rooms/${code}/joinRequests`))
  await set(reqRef, { name, skill, requestedAt: Date.now() })
  return reqRef.key
}