import { Request, Response } from "express"
import z from "zod"
import { validator } from "../../utils/validator"
import * as runService from "./run.service"

const createRunSchema = z.object({
    name: z.string().min(1, "Run name is required"),
    distance: z.number().positive("Distance must be positive"),
    time: z.number().nonnegative("Time must be non-negative"),
    pace: z.string(),
    route: z
        .array(
            z.object({
                latitude: z.number(),
                longitude: z.number(),
            })
        )
        .min(2, "At least 2 route points are required"),
    map_image: z.string().optional(),
    start_address: z.string().optional(),
    end_address: z.string().optional(),
})

const { getBody } = validator({ body: createRunSchema })

export const listRuns = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" })
        }

        const runs = await runService.getAllRuns(userId)
        res.json(runs)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const getRunById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const run = await runService.getRunById(id)

        if (!run) {
            return res.status(404).json({ error: "Run not found" })
        }

        res.json(run)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const createRun = async (req: Request, res: Response) => {
    try {
        const {
            name,
            distance,
            time,
            pace,
            route,
            map_image,
            start_address,
            end_address,
        } = getBody(req)

        const created_by = req.user?.id

        if (!created_by) {
            return res.status(401).json({ error: "Not authenticated" })
        }

        const run = await runService.createRun({
            name,
            distance,
            time,
            pace,
            route,
            map_image,
            start_address,
            end_address,
            created_by,
        })

        res.status(201).json(run)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const deleteRun = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await runService.deleteRun(id)
        res.json({ message: "Run deleted successfully" })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
