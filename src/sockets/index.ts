import { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: { origin: "*" },
    })

    io.on("connection", (socket: Socket) => {
        console.log("Client connected:", socket.id)

        socket.on("joinRoom", (roomId: string) => {
            socket.join(roomId)
            console.log(`${socket.id} joined room ${roomId}`)
        })

        socket.on("locationUpdate", ({ roomId, lat, lng }) => {
            socket
                .to(roomId)
                .emit("locationUpdate", { id: socket.id, lat, lng })
        })

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id)
        })
    })
}
