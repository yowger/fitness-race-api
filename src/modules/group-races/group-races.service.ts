import { supabase } from "../../config/supabase"

interface CreateRaceInput {
    name: string
    description?: string
    start_time: string
    end_time?: string
    max_participants?: number
    route_id?: string
    created_by?: string
}

interface AddParticipantInput {
    race_id: string
    user_id: string
}

export const createRace = async (input: CreateRaceInput) => {
    const { data, error } = await supabase
        .from("group_races")
        .insert([
            {
                name: input.name,
                description: input.description,
                start_time: input.start_time,
                end_time: input.end_time,
                max_participants: input.max_participants ?? 0,
                route_id: input.route_id,
                created_by: input.created_by,
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getAllRaces = async () => {
    const { data, error } = await supabase
        .from("group_races")
        .select(
            `
      *,
      routes(id, name, distance)
    `
        )
        .order("start_time", { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export const getRaceById = async (id: string) => {
    const { data, error } = await supabase
        .from("group_races")
        .select(
            `
      *,
      routes(id, name, distance, geojson)
    `
        )
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const addParticipant = async (input: AddParticipantInput) => {
    const { data, error } = await supabase
        .from("race_participants")
        .insert([input])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getParticipantsByRace = async (raceId: string) => {
    const { data, error } = await supabase
        .from("race_participants")
        .select("*, users(id, name, email)")
        .eq("race_id", raceId)

    if (error) throw new Error(error.message)
    return data
}

interface AddTrackingInput {
    race_id: string
    user_id: string
    latitude: number
    longitude: number
    recorded_at?: string
}

export const addTracking = async (input: AddTrackingInput) => {
    const { data, error } = await supabase
        .from("race_tracking")
        .insert([
            {
                race_id: input.race_id,
                user_id: input.user_id,
                latitude: input.latitude,
                longitude: input.longitude,
                recorded_at: input.recorded_at ?? new Date().toISOString(),
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getTrackingByRace = async (raceId: string, userId?: string) => {
    let query = supabase
        .from("race_tracking")
        .select("*")
        .eq("race_id", raceId)
        .order("recorded_at", { ascending: true })

    if (userId) query = query.eq("user_id", userId)

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
}

export const getLatestTracking = async (raceId: string, userId: string) => {
    const { data, error } = await supabase
        .from("race_tracking")
        .select("*")
        .eq("race_id", raceId)
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single()

    if (error) throw new Error(error.message)
    return data
}

interface AddResultInput {
    race_id: string
    user_id: string
    finish_time: string
    position?: number
}

export const addResult = async (input: AddResultInput) => {
    const { data, error } = await supabase
        .from("race_results")
        .insert([input])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getResultsByRace = async (raceId: string) => {
    const { data, error } = await supabase
        .from("race_results")
        .select("*, users(id, name, email)")
        .eq("race_id", raceId)
        .order("position", { ascending: true })

    if (error) throw new Error(error.message)
    return data
}
