import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"

export type UserIdentity = {
    id: string
    name: string
    avatarUrl?: string
    role: "admin" | "racer" | "guest"
    bib?: number
}

export type LiveRaceState = {
    lat: number
    lng: number
    speed?: number
    distance?: number
    finished: boolean
    lastUpdate: number
}

export type RaceUser = UserIdentity & {
    socketId?: string
    state: LiveRaceState
}

const rooms: Record<string, RaceUser[]> = {}

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: { origin: "*" },
    })

    io.on("connection", (socket: Socket) => {
        console.log("Client connected:", socket.id)

        socket.on("joinRoom", (roomId: string, user: UserIdentity) => {
            if (!user) return

            socket.join(roomId)
            if (!rooms[roomId]) rooms[roomId] = []

            const existing = rooms[roomId].find((u) => u.id === user.id)

            if (existing) {
                existing.socketId = socket.id
            } else {
                rooms[roomId].push({
                    ...user,
                    socketId: socket.id,
                    state: {
                        lat: 0,
                        lng: 0,
                        speed: 0,
                        distance: 0,
                        finished: false,
                        lastUpdate: Date.now(),
                    },
                })
            }

            io.to(roomId).emit("roomParticipants", rooms[roomId])
        })

        socket.on("locationUpdate", ({ roomId, id, lat, lng }) => {
            console.log("location update:....", roomId, id, lat, lng)

            const user = rooms[roomId]?.find((u) => u.id === id)
            if (!user) return

            if (user.state.finished) return

            console.log("Updating location for user:", id, lat, lng)

            user.state.lat = lat
            user.state.lng = lng
            user.state.lastUpdate = Date.now()

            socket.to(roomId).emit("locationUpdate", { id: user.id, lat, lng })
        })

        socket.on("finishLine", ({ roomId, id }) => {
            const user = rooms[roomId]?.find((u) => u.id === id)
            if (!user) return

            if (user.state.finished) return

            user.state.finished = true
            user.state.lastUpdate = Date.now()

            io.to(roomId).emit("userFinished", { id: user.id, name: user.name })
        })

        socket.on("leaveRoom", (roomId: string) => {
            io.to(roomId).emit("userLeft", { id: socket.id })

            socket.leave(roomId)

            if (rooms[roomId]) {
                rooms[roomId] = rooms[roomId].filter(
                    (u) => u.socketId !== socket.id
                )

                io.to(roomId).emit("roomParticipants", rooms[roomId])
            }
        })

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id)

            for (const roomId in rooms) {
                const user = rooms[roomId].find((u) => u.socketId === socket.id)
                if (user) {
                    user.socketId = undefined
                }
                io.to(roomId).emit("roomParticipants", rooms[roomId])
            }
        })
    })
}
