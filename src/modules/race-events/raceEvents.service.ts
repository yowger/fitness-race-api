import { supabase } from "../../config/supabase"

interface CreateRaceEventInput {
    race_id: string
    name: string
    scheduled_time: string
    type?: "registration" | "race" | "awards" | "other"
    description?: string
}

export const getEventsByRaceId = async (race_id: string) => {
    const { data, error } = await supabase
        .from("race_events")
        .select("*")
        .eq("race_id", race_id)
        .order("scheduled_time")
    if (error) throw new Error(error.message)
    return data
}

export const createRaceEvent = async (input: CreateRaceEventInput) => {
    const { data, error } = await supabase
        .from("race_events")
        .insert([input])
        .select()
        .single()
    if (error) throw new Error(error.message)
    return data
}

export const deleteRaceEvent = async (id: string) => {
    const { error } = await supabase.from("race_events").delete().eq("id", id)
    if (error) throw new Error(error.message)
}
