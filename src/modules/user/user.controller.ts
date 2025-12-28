import { Request, Response } from "express"
import * as userService from "./user.service"
import { validator } from "../../utils/validator"
import { createUserSchema } from "./user.schema"

const { getBody } = validator({
    body: createUserSchema,
})

export const getProfile = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" })
    }

    const profile = await userService.getUserById(req.user.id)
    return res.json(profile)
}

export const getProfileById = async (req: Request, res: Response) => {
    const profile = await userService.getUserById(req.params.id)
    return res.json(profile)
}

export const listUsers = async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers()
    res.json(users)
}

export const createUser = async (req: Request, res: Response) => {
    const { id, email, fullName, avatar_url } = getBody(req)

    const user = await userService.createUser({
        id,
        email,
        fullName,
        avatar_url,
    })

    res.status(201).json({
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
        },
    })
}
