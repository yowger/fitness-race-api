import { supabase } from "../../config/supabase"

interface CreateRaceInput {
    name: string
    description?: string
    start_time: string
    end_time?: string
    banner_url?: string
    route_id?: string
    created_by?: string
}

export const getAllRaces = async () => {
    const { data, error } = await supabase
        .from("races")
        .select(
            `
            id,
            name,
            description,
            start_time,
            end_time,
            banner_url,
            route_id,
            created_by,
            created_at,
            routes (id, name, distance)
        `
        )
        .order("start_time", { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export const getRaceById = async (id: string) => {
    const { data, error } = await supabase
        .from("races")
        .select(
            `
            id,
            name,
            description,
            start_time,
            end_time,
            banner_url,
            route_id,
            created_by,
            created_at,
            routes (id, name, distance, geojson)
        `
        )
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const createRace = async (input: CreateRaceInput) => {
    const { data, error } = await supabase
        .from("races")
        .insert([
            {
                name: input.name,
                description: input.description,
                banner_url: input.banner_url,
                start_time: input.start_time,
                end_time: input.end_time,
                route_id: input.route_id,
                created_by: input.created_by,
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const deleteRace = async (id: string) => {
    const { error } = await supabase.from("races").delete().eq("id", id)
    if (error) throw new Error(error.message)
}
