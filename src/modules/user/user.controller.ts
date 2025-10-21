import { Request, Response } from "express"
import z from "zod"

import * as userService from "./user.service"
import { validator } from "../../utils/validator"

const createUserSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
})

const { getBody } = validator({
    body: createUserSchema,
})

export const getProfile = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" })
    }

    res.json(req.user)
}

export const listUsers = async (_req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers()
        res.json(users)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName } = getBody(req)

        const user = await userService.createUser({ email, password, fullName })
        const accessToken = await userService.signInUser(email, password)

        res.status(201).json({
            user: {
                userId: user.id,
                email: user.email,
                fullName: user.user_metadata.full_name,
            },
            accessToken,
        })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
