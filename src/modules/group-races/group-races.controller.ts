import { Request, Response } from "express"
import z from "zod"
import { validator } from "../../utils/validator"
import * as raceService from "./group-races.service"

export const createRaceSchema = z.object({
    name: z.string().min(1, "Race name is required"),
    price: z.number().min(0, "Price must be 0 or greater").optional(),
    banner_url: z.string("Invalid banner URL").optional(),
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

const raceResultStatusEnum = z.enum([
    "Finished",
    "DNF",
    "DNS",
    "Disqualified",
    "Did Not Join",
])

export const publishResultsSchema = z.object({
    race_id: z.string(),
    results: z.array(
        z.object({
            user_id: z.string(),
            position: z.number().int().nullable().optional(),
            status: raceResultStatusEnum.optional(),
            finish_time: z.number().nullable().optional(),
        })
    ),
})

const createRaceValidator = validator({ body: createRaceSchema })
const addParticipantValidator = validator({ body: addParticipantSchema })
const addTrackingValidator = validator({ body: addTrackingSchema })
const addResultValidator = validator({ body: addResultSchema })
const removeParticipantValidator = validator({ body: removeParticipantSchema })
const publishResultsValidator = validator({ body: publishResultsSchema })

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

export const startRace = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const userId = req.user?.id
        const race = await raceService.startRace(raceId, userId!)
        res.json(race)
    } catch (err) {
        res.status(400).json({ error: (err as Error).message })
    }
}

export const endRace = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const userId = req.user?.id
        const race = await raceService.endRace(raceId, userId!)
        res.json(race)
    } catch (err) {
        res.status(400).json({ error: (err as Error).message })
    }
}

export const publishRaceResults = async (req: Request, res: Response) => {
    try {
        const body = publishResultsValidator.getBody(req)
        const userId = req.user?.id

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        await raceService.publishRaceResults(body.results, body.race_id, userId)

        res.json({
            message: "Race results published and race marked as complete.",
        })
    } catch (err) {
        res.status(400).json({
            error: (err as Error).message,
        })
    }
}

export const updateBibSchema = z.object({
    race_id: z.string(),
    user_id: z.string(),
    bib_number: z.number().int().min(1, "Bib number must be 1 or greater"),
})

const updateBibValidator = validator({ body: updateBibSchema })

export const updateParticipantBibController = async (
    req: Request,
    res: Response
) => {
    try {
        const body = updateBibValidator.getBody(req)

        const updatedParticipant = await raceService.updateParticipantBib({
            race_id: body.race_id,
            user_id: body.user_id,
            bib_number: body.bib_number,
        })

        res.json({
            message: "Bib number updated successfully.",
            participant: updatedParticipant,
        })
    } catch (err) {
        res.status(400).json({ error: (err as Error).message })
    }
}

const raceStatusEnum = z.enum(["upcoming", "ongoing", "finished", "complete"])

export const getResultsByRacePaginatedSchema = z.object({
    userId: z.string(),
    status: raceStatusEnum.optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
})

const getResultsByRacePaginatedValidator = validator({
    query: getResultsByRacePaginatedSchema,
})

export const getResultsByRacePaginatedController = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            userId,
            status,
            limit = 50,
            offset = 0,
        } = getResultsByRacePaginatedValidator.getQuery(req)

        const resultsWithCount = await raceService.getRunnerResultsPaginated({
            runnerUserId: userId,
            status,
            limit,
            offset,
        })

        res.json(resultsWithCount)
    } catch (err) {
        if (err instanceof Error) res.status(400).json({ error: err.message })
    }
}

export const getRunnerProfileStatsSchema = z.object({
    userId: z.string(),
})

const getRunnerProfileStatsValidator = validator({
    query: getRunnerProfileStatsSchema,
})

export const getRunnerProfileStatsController = async (
    req: Request,
    res: Response
) => {
    try {
        const { userId } = getRunnerProfileStatsValidator.getQuery(req)

        const stats = await raceService.getRunnerProfileStats(userId)

        res.json(stats)
    } catch (err) {
        res.status(400).json({
            error: (err as Error).message,
        })
    }
}
