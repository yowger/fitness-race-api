import z from "zod"

export const createUserSchema = z.object({
    id: z.string().min(1),
    email: z.email(),
    fullName: z.string().min(1),
    username: z.string().optional(),
    avatar_url: z.string().optional(),
})
