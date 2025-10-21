import { Request } from "express"
import { z, ZodError } from "zod"

type ValidationSchema = {
    body?: z.ZodType
    params?: z.ZodType
    query?: z.ZodType
}
type InferSchema<T, K extends keyof T> = T[K] extends z.ZodType
    ? z.infer<T[K]>
    : unknown

type ValidationHelpers<T extends ValidationSchema> = {
    getBody(req: Request): InferSchema<T, "body">
    getParams(req: Request): InferSchema<T, "params">
    getQuery(req: Request): InferSchema<T, "query">
}

export function validator<T extends ValidationSchema>(
    schemas: T
): ValidationHelpers<T> {
    function createValidator<K extends keyof ValidationSchema>(key: K) {
        return (req: Request): InferSchema<T, K> => {
            const schema = schemas[key]
            if (!schema) {
                return req[key] as InferSchema<T, K>
            }

            try {
                return schema.parse(req[key] as unknown) as InferSchema<T, K>
            } catch (err: unknown) {
                if (err instanceof ZodError) {
                    throw new Error(
                        `${key} validation failed: ${err.issues.map((i) => i.message).join(", ")}`
                    )
                }
                throw err
            }
        }
    }

    return {
        getBody: createValidator("body"),
        getParams: createValidator("params"),
        getQuery: createValidator("query"),
    }
}
