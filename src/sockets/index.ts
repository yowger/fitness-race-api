import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"

type User = {
    id: string
    name?: string
    lat?: number
    lng?: number
    finished?: boolean
}

const rooms: Record<string, User[]> = {}

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: { origin: "*" },
    })

    io.on("connection", (socket: Socket) => {
        console.log("Client connected:", socket.id)

        socket.on("joinRoom", (roomId: string, user: { name?: string }) => {
            if (!user) return

            console.log("User joined:", socket.id, user)
            socket.join(roomId)

            if (!rooms[roomId]) rooms[roomId] = []

            if (!rooms[roomId].find((u) => u.id === socket.id)) {
                rooms[roomId].push({
                    id: socket.id,
                    name: user.name,
                    lat: undefined,
                    lng: undefined,
                    finished: false,
                })
            }

            io.to(roomId).emit("roomParticipants", rooms[roomId])
        })

        socket.on(
            "locationUpdate",
            ({
                roomId,
                lat,
                lng,
            }: {
                roomId: string
                lat: number
                lng: number
            }) => {
                console.log("Location update:", roomId, socket.id, lat, lng)

                const user = rooms[roomId]?.find((u) => u.id === socket.id)
                if (user) {
                    user.lat = lat
                    user.lng = lng
                }

                socket.to(roomId).emit("locationUpdate", {
                    id: socket.id,
                    lat,
                    lng,
                })
            }
        )

        socket.on("finishLine", ({ roomId }: { roomId: string }) => {
            console.log("FINISH received from:", socket.id)

            const user = rooms[roomId]?.find((u) => u.id === socket.id)
            if (user && !user.finished) {
                user.finished = true

                console.log(
                    `🏁 ${user.name || socket.id} finished in room ${roomId}`
                )

                io.to(roomId).emit("userFinished", {
                    id: socket.id,
                    name: user.name,
                })
            }
        })

        socket.on("leaveRoom", (roomId: string) => {
            console.log("Client left room:", socket.id, socket.id)

            io.to(roomId).emit("userLeft", { id: socket.id })

            socket.leave(roomId)

            if (rooms[roomId]) {
                rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id)
                io.to(roomId).emit("roomParticipants", rooms[roomId])
            }
        })

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id)

            for (const roomId in rooms) {
                rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id)
                io.to(roomId).emit("roomParticipants", rooms[roomId])
            }
        })
    })
}
