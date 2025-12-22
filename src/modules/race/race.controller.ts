import { Request, Response } from "express"
import z from "zod"
import { validator } from "../../utils/validator"
import * as raceService from "./race.service"

const createRaceSchema = z.object({
    name: z.string().min(1, "Race name is required"),
    description: z.string().optional(),
    banner_url: z.url("Invalid banner URL").optional(),
    start_time: z.string().datetime("Invalid start time format"),
    end_time: z.string().datetime().optional(),
    route_id: z.string("Invalid route ID").optional(),
})

const { getBody } = validator({ body: createRaceSchema })

export const listRaces = async (_req: Request, res: Response) => {
    try {
        const races = await raceService.getAllRaces()
        res.json(races)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const getRaceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const race = await raceService.getRaceById(id)

        if (!race) {
            return res.status(404).json({ error: "Race not found" })
        }

        res.json(race)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const createRace = async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            banner_url,
            start_time,
            end_time,
            route_id,
        } = getBody(req)
        const created_by = req.user?.id

        const race = await raceService.createRace({
            name,
            description,
            banner_url,
            start_time,
            end_time,
            route_id,
            created_by,
        })

        res.status(201).json(race)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const deleteRace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await raceService.deleteRace(id)
        res.json({ message: "Race deleted successfully" })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
