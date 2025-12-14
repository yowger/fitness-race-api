// // import { Server as HttpServer } from "http"
// // import { Server, Socket } from "socket.io"

// // export type UserIdentity = {
// //     id: string
// //     name: string
// //     avatarUrl?: string
// //     role: "admin" | "racer" | "guest"
// //     bib?: number
// // }

// // export type LiveRaceState = {
// //     lat: number
// //     lng: number
// //     speed?: number
// //     distance?: number
// //     finished: boolean
// //     lastUpdate: number
// // }

// // export type RaceUser = UserIdentity & {
// //     socketId?: string
// //     state: LiveRaceState
// // }

// // const rooms: Record<string, RaceUser[]> = {}

// // export const initSocket = (server: HttpServer) => {
// //     const io = new Server(server, {
// //         cors: { origin: "*" },
// //     })

// //     io.on("connection", (socket: Socket) => {
// //         console.log("Client connected:", socket.id)

// //         socket.on("joinRoom", (roomId: string, user: UserIdentity) => {
// //             if (!user) return

// //             socket.join(roomId)
// //             if (!rooms[roomId]) rooms[roomId] = []

// //             const existing = rooms[roomId].find((u) => u.id === user.id)

// //             if (existing) {
// //                 existing.socketId = socket.id
// //             } else {
// //                 rooms[roomId].push({
// //                     ...user,
// //                     socketId: socket.id,
// //                     state: {
// //                         lat: 0,
// //                         lng: 0,
// //                         speed: 0,
// //                         distance: 0,
// //                         finished: false,
// //                         lastUpdate: Date.now(),
// //                     },
// //                 })
// //             }

// //             io.to(roomId).emit("roomParticipants", rooms[roomId])
// //         })

// //         socket.on("locationUpdate", ({ roomId, id, lat, lng }) => {
// //             console.log("location update:....", roomId, id, lat, lng)

// //             const user = rooms[roomId]?.find((u) => u.id === id)
// //             if (!user) return

// //             if (user.state.finished) return

// //             console.log("Updating location for user:", id, lat, lng)

// //             user.state.lat = lat
// //             user.state.lng = lng
// //             user.state.lastUpdate = Date.now()

// //             socket.to(roomId).emit("locationUpdate", { id: user.id, lat, lng })
// //         })

// //         socket.on("finishLine", ({ roomId, id }) => {
// //             const user = rooms[roomId]?.find((u) => u.id === id)
// //             if (!user) return

// //             if (user.state.finished) return

// //             user.state.finished = true
// //             user.state.lastUpdate = Date.now()

// //             io.to(roomId).emit("userFinished", { id: user.id, name: user.name })
// //         })

// //         socket.on("leaveRoom", (roomId: string) => {
// //             io.to(roomId).emit("userLeft", { id: socket.id })

// //             socket.leave(roomId)

// //             if (rooms[roomId]) {
// //                 rooms[roomId] = rooms[roomId].filter(
// //                     (u) => u.socketId !== socket.id
// //                 )

// //                 io.to(roomId).emit("roomParticipants", rooms[roomId])
// //             }
// //         })

// //         socket.on("disconnect", () => {
// //             console.log("Client disconnected:", socket.id)

// //             for (const roomId in rooms) {
// //                 const user = rooms[roomId].find((u) => u.socketId === socket.id)
// //                 if (user) {
// //                     user.socketId = undefined
// //                 }
// //                 io.to(roomId).emit("roomParticipants", rooms[roomId])
// //             }
// //         })
// //     })
// // }

// import { Server, Socket } from "socket.io"
// import { Server as HttpServer } from "http"
// import { supabase } from "../config/supabase"

// const raceRooms: Record<string, boolean> = {}

// interface OnlineUser {
//     userId: string
//     socketId: string
//     role: "admin" | "racer" | "guest"
//     coords?: [number, number]
//     lastUpdate?: number
//     speed?: number
//     distance?: number
//     finished?: boolean
//     lastEmit?: number
// }

// const onlineParticipants: Record<string, OnlineUser[]> = {}

// const raceFinishCache: Record<string, [number, number]> = {}
// const raceStartCache: Record<string, number> = {}
// const raceStatusCache: Record<string, "upcoming" | "ongoing" | "finished"> = {}

// const FINISH_RADIUS_METERS = 100

// function getOnline(raceId: string) {
//     return onlineParticipants[raceId] || []
// }

// function haversineDistance(
//     [lng1, lat1]: [number, number],
//     [lng2, lat2]: [number, number]
// ) {
//     const R = 6371000
//     const toRad = (x: number) => (x * Math.PI) / 180
//     const dLat = toRad(lat2 - lat1)
//     const dLon = toRad(lng2 - lng1)
//     const a =
//         Math.sin(dLat / 2) ** 2 +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
//     return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
// }

// function computeLeaderboard(raceId: string) {
//     return getOnline(raceId)
//         .filter((p) => p.role === "racer")
//         .sort((a, b) => {
//             if (a.finished && b.finished)
//                 return (a.lastUpdate ?? 0) - (b.lastUpdate ?? 0)
//             if (a.finished) return -1
//             if (b.finished) return 1
//             return (b.distance ?? 0) - (a.distance ?? 0)
//         })
//         .map((p, index) => ({
//             userId: p.userId,
//             position: index + 1,
//             distance: Math.floor(p.distance ?? 0),
//             finished: p.finished ?? false,
//         }))
// }

// export const initSocket = (server: HttpServer) => {
//     const io = new Server(server, {
//         cors: { origin: "*" },
//     })

//     io.on("connection", (socket: Socket) => {
//         socket.on("createRace", ({ raceId }) => {
//             if (!raceRooms[raceId]) {
//                 raceRooms[raceId] = true
//                 onlineParticipants[raceId] = []
//                 raceStatusCache[raceId] = "upcoming"
//             }

//             socket.join(raceId)
//             socket.emit("raceCreated", { raceId })
//         })

//         socket.on(
//             "joinRace",
//             async ({ raceId, userId }: { raceId: string; userId: string }) => {
//                 if (
//                     onlineParticipants[raceId]?.some((p) => p.userId === userId)
//                 ) {
//                     console.log(`User ${userId} already in race ${raceId}.`)

//                     return
//                 }

//                 console.log(`User ${userId} joining race ${raceId}.`)

//                 const { data: race } = await supabase
//                     .from("races")
//                     .select("created_by_user_id")
//                     .eq("id", raceId)
//                     .single()

//                 const isAdmin = userId === race?.created_by_user_id

//                 let participant = null
//                 if (!isAdmin) {
//                     const { data } = await supabase
//                         .from("race_participants")
//                         .select("id")
//                         .eq("race_id", raceId)
//                         .eq("user_id", userId)
//                         .single()
//                     participant = data
//                 }

//                 const role: OnlineUser["role"] = isAdmin
//                     ? "admin"
//                     : participant
//                       ? "racer"
//                       : "guest"

//                 socket.join(raceId)

//                 if (!onlineParticipants[raceId]) onlineParticipants[raceId] = []

//                 onlineParticipants[raceId].push({
//                     userId,
//                     socketId: socket.id,
//                     role,
//                     distance: 0,
//                     finished: false,
//                 })

//                 io.to(raceId).emit("onlineParticipants", getOnline(raceId))
//             }
//         )

//         socket.on("disconnect", () => {
//             for (const raceId of Object.keys(onlineParticipants)) {
//                 onlineParticipants[raceId] = onlineParticipants[raceId].filter(
//                     (p) => p.socketId !== socket.id
//                 )

//                 io.to(raceId).emit("onlineParticipants", getOnline(raceId))
//             }
//         })

//         socket.on("race-started", async ({ raceId, actualStartTime }) => {
//             raceStartCache[raceId] = new Date(actualStartTime).getTime()
//             raceStatusCache[raceId] = "ongoing"

//             const { data: race } = await supabase
//                 .from("group_races")
//                 .select("route_id")
//                 .eq("id", raceId)
//                 .single()

//             if (race?.route_id) {
//                 const { data: route } = await supabase
//                     .from("routes")
//                     .select("geojson")
//                     .eq("id", race.route_id)
//                     .single()

//                 const coords = route?.geojson.features[0].geometry.coordinates
//                 raceFinishCache[raceId] = coords[coords.length - 1]
//             }

//             io.to(raceId).emit("raceStatusUpdate", {
//                 status: "ongoing",
//                 actualStartTime,
//             })
//         })

//         socket.on(
//             "participantUpdate",
//             async ({ raceId, userId, coords, timestamp, speed }) => {
//                 const participant = onlineParticipants[raceId]?.find(
//                     (p) => p.userId === userId
//                 )
//                 if (!participant) return

//                 if (participant.coords) {
//                     const segment = haversineDistance(
//                         participant.coords,
//                         coords
//                     )
//                     participant.distance =
//                         (participant.distance ?? 0) + segment / 1000
//                 }

//                 participant.coords = coords
//                 participant.lastUpdate = timestamp
//                 participant.speed = speed

//                 const now = Date.now()
//                 const shouldEmit =
//                     !participant.lastEmit || now - participant.lastEmit >= 1000
//                 if (shouldEmit) {
//                     participant.lastEmit = now

//                     io.to(raceId).emit("participantUpdate", {
//                         userId,
//                         coords,
//                         timestamp,
//                         speed,
//                         distance: participant.distance ?? 0,
//                     })

//                     if (participant.role === "racer" && !participant.finished) {
//                         await supabase.from("race_tracking").insert({
//                             race_id: raceId,
//                             user_id: userId,
//                             latitude: coords[1],
//                             longitude: coords[0],
//                             recorded_at: new Date(timestamp).toISOString(),
//                         })
//                     }

//                     const finish = raceFinishCache[raceId]
//                     const raceStart = raceStartCache[raceId]

//                     if (finish && raceStart) {
//                         const distanceToFinish = haversineDistance(
//                             coords,
//                             finish
//                         )

//                         if (distanceToFinish <= FINISH_RADIUS_METERS) {
//                             participant.finished = true
//                             const finishTimeMs = timestamp - raceStart

//                             await supabase.from("race_results").upsert({
//                                 race_id: raceId,
//                                 user_id: userId,
//                                 finish_time: finishTimeMs,
//                                 recorded_at: new Date(timestamp).toISOString(),
//                             })

//                             io.to(raceId).emit("racerFinished", {
//                                 userId,
//                                 finishTimeMs,
//                             })

//                             console.log(`Racer ${userId} finished!`)
//                         }
//                     }

//                     const leaderboard = computeLeaderboard(raceId)

//                     io.to(raceId).emit("leaderboardUpdate", leaderboard)
//                 }
//             }
//         )

//         socket.on("race-ended", async ({ raceId }) => {
//             raceStatusCache[raceId] = "finished"

//             const leaderboard = computeLeaderboard(raceId)

//             for (const entry of leaderboard) {
//                 await supabase.from("race_results").upsert({
//                     race_id: raceId,
//                     user_id: entry.userId,
//                     position: entry.position,
//                     recorded_at: new Date().toISOString(),
//                 })
//             }

//             io.to(raceId).emit("raceStatusUpdate", {
//                 status: "finished",
//             })
//         })
//     })

//     return io
// }
