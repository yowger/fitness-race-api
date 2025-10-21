import type { Request, Response, NextFunction } from "express"

type Controller = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>

export const asyncHandler =
    (controller: Controller) =>
    async (req: Request, res: Response, next: NextFunction) => {
        controller(req, res, next).catch(next)
    }
