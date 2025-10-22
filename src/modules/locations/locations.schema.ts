import z from "zod"

export const createLocationSchema = z.object({
    participant_id: z.string().uuid(),
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number().optional(),
    distance_from_start: z.number().optional(),
    timestamp: z.string().datetime().optional(),
})
