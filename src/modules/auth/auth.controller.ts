import { Request, Response } from "express"

import * as authService from "../auth/auth.service"
import { signInSchema } from "./auth.schema"
import { validator } from "../../utils/validator"

const { getBody } = validator({
    body: signInSchema,
})

export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = getBody(req)
        const accessToken = await authService.signInUser(email, password)

        res.status(200).json({ accessToken })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
