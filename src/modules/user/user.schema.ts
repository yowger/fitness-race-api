import z from "zod"

export const createUserSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    fullName: z.string().min(1),
})
