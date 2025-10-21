import { Request, Response } from "express"

import { supabase } from "../../config/supabase"

export const getProfile = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" })
    }

    res.json(req.user)
}

export const listUsers = async (_req: Request, res: Response) => {
    const { data, error } = await supabase
        .from("users")
        .select("id, email, username")

    if (error) return res.status(400).json({ error: error.message })
    res.json(data)
}
