import type { Request, Response, NextFunction } from "express"

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const status = err.status || 500
    const message = err.message || "Internal Server Error"
    console.log("🚀 ~ errorHandler ~ err.message:", err.message)
    res.status(status).json({ message })
}
