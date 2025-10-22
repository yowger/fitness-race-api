import { supabase } from "../../config/supabase"

interface CreateLocationInput {
    participant_id: string
    latitude: number
    longitude: number
    speed?: number
    distance_from_start?: number
    timestamp?: string
}

export const addLocation = async (input: CreateLocationInput) => {
    const { data, error } = await supabase
        .from("locations")
        .insert([
            {
                participant_id: input.participant_id,
                latitude: input.latitude,
                longitude: input.longitude,
                speed: input.speed,
                distance_from_start: input.distance_from_start,
                timestamp: input.timestamp ?? new Date().toISOString(),
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getLocationsByParticipant = async (participantId: string) => {
    const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("participant_id", participantId)
        .order("timestamp", { ascending: true })

    if (error) throw new Error(error.message)
    return data
}

export const getLatestLocation = async (participantId: string) => {
    const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("participant_id", participantId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single()

    if (error) throw new Error(error.message)
    return data
}
