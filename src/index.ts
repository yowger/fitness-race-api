import http from "http"
import app from "./app"
import { ENV } from "./config/env"

const PORT = ENV.PORT || 4000

const server = http.createServer(app)

server.listen(PORT, () => {
    console.log(`Server running in ${ENV.NODE_ENV} mode on port ${PORT}`)
})

process.on("SIGINT", () => {
    console.log("Server shutting down...")
    server.close(() => process.exit(0))
})
