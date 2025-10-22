import { supabase } from "../../config/supabase"

interface JoinRaceInput {
    race_id: string
    user_id: string
}

interface UpdateProgressInput {
    id: string
    total_distance?: number
    total_duration?: number
    rank?: number
    status?: string
    end_time?: string
}

export const joinRace = async (input: JoinRaceInput) => {
    const { data, error } = await supabase
        .from("race_participants")
        .insert([
            {
                race_id: input.race_id,
                user_id: input.user_id,
                start_time: new Date().toISOString(),
                status: "active",
            },
        ])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getParticipants = async (raceId: string) => {
    const { data, error } = await supabase
        .from("race_participants")
        .select(
            `
            id,
            race_id,
            user_id,
            total_distance,
            total_duration,
            rank,
            status,
            start_time,
            end_time,
            created_at,
            users (id, full_name, email)
        `
        )
        .eq("race_id", raceId)
        .order("rank", { ascending: true, nullsFirst: true })

    if (error) throw new Error(error.message)
    return data
}

export const updateProgress = async (input: UpdateProgressInput) => {
    const { data, error } = await supabase
        .from("race_participants")
        .update({
            total_distance: input.total_distance,
            total_duration: input.total_duration,
            rank: input.rank,
            status: input.status,
            end_time: input.end_time,
        })
        .eq("id", input.id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const leaveRace = async (raceId: string, userId: string) => {
    const { error } = await supabase
        .from("race_participants")
        .delete()
        .eq("race_id", raceId)
        .eq("user_id", userId)

    if (error) throw new Error(error.message)
}
