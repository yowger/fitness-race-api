import { Request, Response } from "express"
import z from "zod"

import { validator } from "../../utils/validator"
import * as locationService from "./locations.service"
import { createLocationSchema } from "./locations.schema"

const { getBody } = validator({ body: createLocationSchema })

export const addLocation = async (req: Request, res: Response) => {
    try {
        const body = getBody(req)
        const data = await locationService.addLocation(body)
        res.status(201).json(data)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const getParticipantLocations = async (req: Request, res: Response) => {
    try {
        const { participantId } = req.params
        const data =
            await locationService.getLocationsByParticipant(participantId)
        res.json(data)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const getLatestLocation = async (req: Request, res: Response) => {
    try {
        const { participantId } = req.params
        const data = await locationService.getLatestLocation(participantId)
        res.json(data)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
