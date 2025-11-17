import { Request, Response } from "express"

import * as routeService from "./routes.service"
import { createRouteSchema } from "./routes.schema"
import { validator } from "../../utils/validator"

const { getBody } = validator({ body: createRouteSchema })

export const listRoutes = async (_req: Request, res: Response) => {
    try {
        const routes = await routeService.getAllRoutes()
        res.json(routes)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const getRouteById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const route = await routeService.getRouteById(id)

        if (!route) {
            return res.status(404).json({ error: "Route not found" })
        }

        res.json(route)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const createRoute = async (req: Request, res: Response) => {
    try {
        const { name, description, distance, geojson, map_url } = getBody(req)
        const createdBy = req.user?.id

        const route = await routeService.createRoute({
            name,
            description,
            distance,
            geojson,
            map_url,
            createdBy,
        })

        res.status(201).json(route)
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}

export const deleteRoute = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await routeService.deleteRoute(id)
        res.json({ message: "Route deleted successfully" })
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message })
        }
    }
}
