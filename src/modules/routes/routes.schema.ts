import z from "zod"

export const createRouteSchema = z.object({
    name: z.string().min(1, "Route name is required"),
    description: z.string().optional(),
    distance: z.number().positive().optional(),
    geojson: z.any(),
})
