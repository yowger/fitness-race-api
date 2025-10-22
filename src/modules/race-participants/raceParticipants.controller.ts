import { Request, Response } from "express"
import z from "zod"

import { validator } from "../../utils/validator"
import * as raceParticipantService from "./raceParticipants.service"
import { joinSchema, progressSchema } from "./raceParticipants.schema"

const { getBody: getJoinBody } = validator({ body: joinSchema })
const { getBody: getProgressBody } = validator({ body: progressSchema })

export const joinRace = async (req: Request, res: Response) => {
    try {
        const { race_id } = getJoinBody(req)
        const user_id = req.user?.id

        if (!user_id) {
            return res.status(401).json({ error: "Not authenticated" })
        }

        const participant = await raceParticipantService.joinRace({
            race_id,
            user_id,
        })

        res.status(201).json(participant)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const listParticipants = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const participants =
            await raceParticipantService.getParticipants(raceId)
        res.json(participants)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const updateProgress = async (req: Request, res: Response) => {
    try {
        const { participantId } = req.params
        const body = getProgressBody(req)

        const updated = await raceParticipantService.updateProgress({
            id: participantId,
            ...body,
        })

        res.json(updated)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const leaveRace = async (req: Request, res: Response) => {
    try {
        const { raceId } = req.params
        const userId = req.user?.id

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" })
        }

        await raceParticipantService.leaveRace(raceId, userId)
        res.json({ message: "Left race successfully" })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
