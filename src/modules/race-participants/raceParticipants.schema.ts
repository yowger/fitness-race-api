import z from "zod"

export const joinSchema = z.object({
    race_id: z.string().uuid(),
})

export const progressSchema = z.object({
    total_distance: z.number().optional(),
    total_duration: z.number().optional(),
    rank: z.number().optional(),
    status: z.enum(["active", "finished", "disqualified"]).optional(),
    end_time: z.string().datetime().optional(),
})
