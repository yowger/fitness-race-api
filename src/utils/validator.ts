// import { Request } from "express"
// import { z, ZodError } from "zod"

// type ValidationSchema = {
//     body?: z.ZodAny
//     params?: z.ZodAny
//     query?: z.ZodAny
// }
// type InferSchema<T, K extends keyof T> = T[K] extends z.ZodAny
//     ? z.infer<T[K]>
//     : unknown

// type ValidationHelpers<T extends ValidationSchema> = {
//     getBody(req: Request): InferSchema<T, "body">
//     getParams(req: Request): InferSchema<T, "params">
//     getQuery(req: Request): InferSchema<T, "query">
// }

// export function validator<T extends ValidationSchema>(
//     schemas: T
// ): ValidationHelpers<T> {
//     function createValidator(key: keyof ValidationSchema) {
//         return function (req: Request) {
//             try {
//                 return schemas[key].parse(req[key])
//             } catch (error) {
//                 throw error
//             }
//         }
//     }

//     return {
//         getBody: createValidator("body"),
//         getParams: createValidator("params"),
//         getQuery: createValidator("query"),
//     }
// }
