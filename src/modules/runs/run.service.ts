import { supabase } from "../../config/supabase"

export interface RunPoint {
    latitude: number
    longitude: number
}

export interface CreateRunInput {
    name: string
    distance: number
    time: number
    pace: string
    route: RunPoint[]
    map_image?: string
    start_address?: string
    end_address?: string
    created_by: string
}

export const getAllRuns = async (userId: string) => {
    const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export const getRunById = async (id: string) => {
    const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const createRun = async (input: CreateRunInput) => {
    const routeJson = JSON.stringify(input.route)

    const { data, error } = await supabase
        .from("runs")
        .insert([
            {
                name: input.name,
                distance: input.distance,
                time: input.time,
                pace: input.pace,
                route: routeJson,
                map_image: input.map_image,
                start_address: input.start_address,
                end_address: input.end_address,
                created_by: input.created_by,
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const deleteRun = async (id: string) => {
    const { error } = await supabase.from("runs").delete().eq("id", id)
    if (error) throw new Error(error.message)
}
