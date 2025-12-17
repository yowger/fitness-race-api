import { Server, Socket } from "socket.io"
import { Server as HttpServer } from "http"
import { supabase } from "../config/supabase"

const raceRooms: Record<string, boolean> = {}

interface OnlineUser {
    userId: string
    socketId: string
    role: "admin" | "racer" | "guest"
    coords?: [number, number]
    lastUpdate?: number
    speed?: number
    distance?: number
    finished?: boolean
    lastEmit?: number
}

const onlineParticipants: Record<string, OnlineUser[]> = {}

const raceFinishCache: Record<string, [number, number]> = {}
const raceStartCache: Record<string, number> = {}
const raceStatusCache: Record<string, "upcoming" | "ongoing" | "finished"> = {}

const FINISH_RADIUS_METERS = 100

function getOnline(raceId: string) {
    return onlineParticipants[raceId] || []
}

function haversineDistance(
    [lng1, lat1]: [number, number],
    [lng2, lat2]: [number, number]
) {
    const R = 6371000
    const toRad = (x: number) => (x * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function computeLeaderboard(raceId: string) {
    return getOnline(raceId)
        .filter((p) => p.role === "racer")
        .sort((a, b) => {
            if (a.finished && b.finished)
                return (a.lastUpdate ?? 0) - (b.lastUpdate ?? 0)
            if (a.finished) return -1
            if (b.finished) return 1
            return (b.distance ?? 0) - (a.distance ?? 0)
        })
        .map((p, index) => ({
            userId: p.userId,
            position: index + 1,
            distance: Math.floor(p.distance ?? 0),
            finished: p.finished ?? false,
        }))
}

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: { origin: "*" },
    })

    io.on("connection", (socket: Socket) => {
        socket.on("createRace", ({ raceId }) => {
            if (!raceRooms[raceId]) {
                raceRooms[raceId] = true
                onlineParticipants[raceId] = []
                raceStatusCache[raceId] = "upcoming"
            }

            socket.join(raceId)
            socket.emit("raceCreated", { raceId })
        })

        socket.on(
            "joinRace",
            async ({ raceId, userId }: { raceId: string; userId: string }) => {
                if (
                    onlineParticipants[raceId]?.some((p) => p.userId === userId)
                ) {
                    console.log(`User ${userId} already in race ${raceId}.`)

                    return
                }

                console.log(`User ${userId} joining race ${raceId}.`)

                const { data: race } = await supabase
                    .from("races")
                    .select("created_by_user_id")
                    .eq("id", raceId)
                    .single()

                const isAdmin = userId === race?.created_by_user_id

                let participant = null
                if (!isAdmin) {
                    const { data } = await supabase
                        .from("race_participants")
                        .select("id")
                        .eq("race_id", raceId)
                        .eq("user_id", userId)
                        .single()
                    participant = data
                }

                const role: OnlineUser["role"] = isAdmin
                    ? "admin"
                    : participant
                      ? "racer"
                      : "guest"

                socket.join(raceId)

                if (!onlineParticipants[raceId]) onlineParticipants[raceId] = []

                onlineParticipants[raceId].push({
                    userId,
                    socketId: socket.id,
                    role,
                    distance: 0,
                    finished: false,
                })

                io.to(raceId).emit("onlineParticipants", getOnline(raceId))
            }
        )

        socket.on("disconnect", () => {
            for (const raceId of Object.keys(onlineParticipants)) {
                onlineParticipants[raceId] = onlineParticipants[raceId].filter(
                    (p) => p.socketId !== socket.id
                )

                io.to(raceId).emit("onlineParticipants", getOnline(raceId))
            }
        })

        socket.on("race-started", async ({ raceId, actualStartTime }) => {
            raceStartCache[raceId] = new Date(actualStartTime).getTime()
            raceStatusCache[raceId] = "ongoing"

            const { data: race } = await supabase
                .from("group_races")
                .select("route_id")
                .eq("id", raceId)
                .single()

            if (race?.route_id) {
                const { data: route } = await supabase
                    .from("routes")
                    .select("geojson")
                    .eq("id", race.route_id)
                    .single()

                const coords = route?.geojson.features[0].geometry.coordinates
                raceFinishCache[raceId] = coords[coords.length - 1]
            }

            io.to(raceId).emit("raceStatusUpdate", {
                status: "ongoing",
                actualStartTime,
            })
        })

        socket.on(
            "participantUpdate",
            async ({ raceId, userId, coords, timestamp, speed }) => {
                const participant = onlineParticipants[raceId]?.find(
                    (p) => p.userId === userId
                )
                if (!participant) return

                if (participant.coords) {
                    const segment = haversineDistance(
                        participant.coords,
                        coords
                    )
                    participant.distance =
                        (participant.distance ?? 0) + segment / 1000
                }

                participant.coords = coords
                participant.lastUpdate = timestamp
                participant.speed = speed

                const now = Date.now()
                const shouldEmit =
                    !participant.lastEmit || now - participant.lastEmit >= 1000
                if (shouldEmit) {
                    participant.lastEmit = now

                    io.to(raceId).emit("participantUpdate", {
                        userId,
                        coords,
                        timestamp,
                        speed,
                        distance: participant.distance ?? 0,
                    })

                    if (participant.role === "racer" && !participant.finished) {
                        await supabase.from("race_tracking").insert({
                            race_id: raceId,
                            user_id: userId,
                            latitude: coords[1],
                            longitude: coords[0],
                            recorded_at: new Date(timestamp).toISOString(),
                        })
                    }

                    const finish = raceFinishCache[raceId]
                    const raceStart = raceStartCache[raceId]

                    if (finish && raceStart) {
                        const distanceToFinish = haversineDistance(
                            coords,
                            finish
                        )

                        if (distanceToFinish <= FINISH_RADIUS_METERS) {
                            participant.finished = true
                            const finishTimeMs = timestamp - raceStart

                            await supabase.from("race_results").upsert({
                                race_id: raceId,
                                user_id: userId,
                                finish_time: finishTimeMs,
                                recorded_at: new Date(timestamp).toISOString(),
                            })

                            io.to(raceId).emit("racerFinished", {
                                userId,
                                finishTimeMs,
                            })

                            console.log(`Racer ${userId} finished!`)
                        }
                    }

                    const leaderboard = computeLeaderboard(raceId)

                    io.to(raceId).emit("leaderboardUpdate", leaderboard)
                }
            }
        )

        socket.on("race-ended", async ({ raceId }) => {
            raceStatusCache[raceId] = "finished"

            const leaderboard = computeLeaderboard(raceId)

            for (const entry of leaderboard) {
                await supabase.from("race_results").upsert({
                    race_id: raceId,
                    user_id: entry.userId,
                    position: entry.position,
                    recorded_at: new Date().toISOString(),
                })
            }

            io.to(raceId).emit("raceStatusUpdate", {
                status: "finished",
            })
        })
    })

    return io
}

/*
type RaceResultStatus =
  | "finished"
  | "dnf"   // started but didn’t finish
  | "dns"   // registered but never started
  | "dsq"  
*/
