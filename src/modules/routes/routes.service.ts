import { supabase } from "../../config/supabase"

interface CreateRouteInput {
    name: string
    description?: string
    distance?: number
    geojson: any
    createdBy?: string
}

export const getAllRoutes = async () => {
    const { data, error } = await supabase
        .from("routes")
        .select("id, name, description, distance, created_by, created_at")

    if (error) throw new Error(error.message)
    return data
}

export const getRouteById = async (id: string) => {
    const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const createRoute = async (input: CreateRouteInput) => {
    const { data, error } = await supabase
        .from("routes")
        .insert([
            {
                name: input.name,
                description: input.description,
                distance: input.distance,
                geojson: input.geojson,
                created_by: input.createdBy,
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const deleteRoute = async (id: string) => {
    const { error } = await supabase.from("routes").delete().eq("id", id)
    if (error) throw new Error(error.message)
}
