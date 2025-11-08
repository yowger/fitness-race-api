import { supabase } from "../../config/supabase"

interface CreateRunInput {
    name: string
    distance: number
    time: number
    pace: string
    route: { latitude: number; longitude: number }[]
    map_image?: string
    start_address?: string
    end_address?: string
    created_by: string
}

export const getAllRuns = async (userId: string) => {
    const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: false })

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
    const geojson = {
        type: "LineString",
        coordinates: input.route.map((p) => [p.longitude, p.latitude]),
    }

    const { data, error } = await supabase
        .from("runs")
        .insert([
            {
                user_id: input.created_by,
                name: input.name,
                total_distance: input.distance,
                total_duration: input.time,
                avg_pace: input.pace,
                start_address: input.start_address,
                end_address: input.end_address,
                geojson,
                map_image: input.map_image,
                end_time: new Date().toISOString(),
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
