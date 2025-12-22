import { Request, Response } from "express"
import z from "zod"
import { validator } from "../../utils/validator"
import * as raceEventsService from "./raceEvents.service"

const createRaceEventSchema = z.object({
    race_id: z.string().uuid("Invalid race ID"),
    name: z.string().min(1, "Event name is required"),
    scheduled_time: z.string().datetime("Invalid scheduled time"),
    type: z.enum(["registration", "race", "awards", "other"]).optional(),
    description: z.string().optional(),
})

const { getBody } = validator({ body: createRaceEventSchema })

export const listRaceEvents = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const events = await raceEventsService.getEventsByRaceId(raceId)
        res.json(events)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const getRaceEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const event = await raceEventsService.getEventsByRaceId(id)

        if (!event) {
            return res.status(404).json({ error: "Race event not found" })
        }

        res.json(event)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const createRaceEvent = async (req: Request, res: Response) => {
    try {
        const { race_id, name, scheduled_time, type, description } =
            getBody(req)

        const event = await raceEventsService.createRaceEvent({
            race_id,
            name,
            scheduled_time,
            type,
            description,
        })

        res.status(201).json(event)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const deleteRaceEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await raceEventsService.deleteRaceEvent(id)
        res.json({ message: "Race event deleted successfully" })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
