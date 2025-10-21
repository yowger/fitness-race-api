import { Request, Response, NextFunction } from "express"
import { supabase } from "../config/supabase"

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: "Missing Authorization header" })
    }

    const token = authHeader.split(" ")[1]
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
        return res.status(401).json({ message: "Invalid token" })
    }

    req.user = data.user
    next()
}
