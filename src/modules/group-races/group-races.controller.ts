import { Request, Response } from "express"
import z from "zod"
import { validator } from "../../utils/validator"
import * as raceService from "./group-races.service"

export const createRaceSchema = z.object({
    name: z.string().min(1, "Race name is required"),
    description: z.string().optional(),
    start_time: z.string("Invalid start time format"),
    end_time: z.string().optional(),
    max_participants: z.number().int().optional(),
    route_id: z.string().optional(),
})

export const addParticipantSchema = z.object({
    race_id: z.string(),
    user_id: z.string(),
})

export const addTrackingSchema = z.object({
    race_id: z.string(),
    user_id: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    recorded_at: z.string().optional(),
})

export const addResultSchema = z.object({
    race_id: z.string(),
    user_id: z.string(),
    finish_time: z.string(),
    position: z.number().int().optional(),
})

export const removeParticipantSchema = z.object({
    race_id: z.string(),
    user_id: z.string(),
})

const createRaceValidator = validator({ body: createRaceSchema })
const addParticipantValidator = validator({ body: addParticipantSchema })
const addTrackingValidator = validator({ body: addTrackingSchema })
const addResultValidator = validator({ body: addResultSchema })
const removeParticipantValidator = validator({ body: removeParticipantSchema })

export const createRace = async (req: Request, res: Response) => {
    try {
        const body = createRaceValidator.getBody(req)
        const created_by = req.user?.id

        const race = await raceService.createRace({ ...body, created_by })
        res.status(201).json(race)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const listRaces = async (req: Request, res: Response) => {
    try {
        const {
            userId,
            createdBy,
            name,
            status,
            startDate,
            endDate,
            limit = 20,
            offset = 0,
        } = req.query

        const filters = {
            userId: typeof userId === "string" ? userId : undefined,
            createdBy: typeof createdBy === "string" ? createdBy : undefined,
            name: typeof name === "string" ? name : undefined,
            status:
                typeof status === "string"
                    ? (status as "upcoming" | "ongoing" | "finished")
                    : undefined,
            startDate: typeof startDate === "string" ? startDate : undefined,
            endDate: typeof endDate === "string" ? endDate : undefined,
            limit: typeof limit === "string" ? parseInt(limit) : undefined,
            offset: typeof offset === "string" ? parseInt(offset) : undefined,
        }

        const races = await raceService.getAllRaces(filters)
        res.json(races)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const getRaceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const race = await raceService.getRaceById(id)
        if (!race) return res.status(404).json({ error: "Race not found" })
        res.json(race)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const addParticipant = async (req: Request, res: Response) => {
    try {
        const body = addParticipantValidator.getBody(req)
        const participant = await raceService.addParticipant(body)

        res.status(201).json(participant)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const removeParticipant = async (req: Request, res: Response) => {
    try {
        const body = removeParticipantValidator.getBody(req)
        const removed = await raceService.removeParticipant(body)
        res.json({
            message: "Successfully left the race.",
            participant: removed,
        })
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const getParticipantsByRace = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const participants = await raceService.getParticipantsByRace(raceId)
        res.json(participants)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const addTracking = async (req: Request, res: Response) => {
    try {
        const body = addTrackingValidator.getBody(req)
        const tracking = await raceService.addTracking(body)
        res.status(201).json(tracking)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const getTrackingByRace = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const userId = req.query.userId as string | undefined
        const tracking = await raceService.getTrackingByRace(raceId, userId)
        res.json(tracking)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const getLatestTracking = async (req: Request, res: Response) => {
    try {
        const { raceId, userId } = req.params
        const tracking = await raceService.getLatestTracking(raceId, userId)
        res.json(tracking)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const addResult = async (req: Request, res: Response) => {
    try {
        const body = addResultValidator.getBody(req)
        const result = await raceService.addResult(body)
        res.status(201).json(result)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const getResultsByRace = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const results = await raceService.getResultsByRace(raceId)
        res.json(results)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}
