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
    bib?: number
}

interface GetAllRacesFilters {
    name?: string
    status?: "upcoming" | "ongoing" | "finished"
    startDate?: string
    endDate?: string
    userId?: string
    limit?: number
    offset?: number
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

export const getAllRaces = async (filters?: GetAllRacesFilters) => {
    const limit = filters?.limit || 20
    const offset = filters?.offset || 0

    let query = supabase.from("group_races").select(`
        *, 
        routes(id, name, distance, map_url),
        created_by_user:users(id, full_name, email, avatar_url),
        participants:race_participants(user_id)
    `)

    if (filters?.name) {
        query = query.ilike("name", `%${filters.name}%`)
    }

    if (filters?.startDate) {
        query = query.gte("start_time", filters.startDate)
    }
    if (filters?.endDate) {
        query = query.lte("start_time", filters.endDate)
    }

    if (filters?.status) {
        const now = new Date().toISOString()
        if (filters.status === "upcoming") query = query.gt("start_time", now)
        else if (filters.status === "ongoing")
            query = query.gte("start_time", now).lte("end_time", now)
        else if (filters.status === "finished")
            query = query.lt("end_time", now)
    }

    if (filters?.userId) {
        query = query.eq("race_participants.user_id", filters.userId)
    }

    query = query.order("start_time", { ascending: false })

    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}

export const getRaceById = async (id: string) => {
    const { data, error } = await supabase
        .from("group_races")
        .select(
            `
                *,
                routes(*),
                created_by_user:users(id, full_name, email, avatar_url),
                participants:race_participants (
                    id,
                    joined_at,
                    bib_number,
                    user:users (
                        id, full_name, email, avatar_url
                )
            )
            `
        )
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const addParticipant = async (input: AddParticipantInput) => {
    const { data: race, error: raceError } = await supabase
        .from("group_races")
        .select("created_by")
        .eq("id", input.race_id)
        .single()

    if (raceError) throw new Error(raceError.message)
    if (race.created_by === input.user_id) {
        throw new Error("Host cannot join their own race.")
    }

    let bibNumber: number

    if (input.bib) {
        const { data: existingBib, error: existingBibError } = await supabase
            .from("race_participants")
            .select("id")
            .eq("race_id", input.race_id)
            .eq("bib_number", input.bib)
            .single()

        if (existingBibError && existingBibError.code !== "PGRST116")
            throw new Error(existingBibError.message)
        if (existingBib)
            throw new Error(`Bib number ${input.bib} is already taken.`)

        bibNumber = input.bib
    } else {
        const { data: maxBibData, error: maxBibError } = await supabase
            .from("race_participants")
            .select("bib_number")
            .eq("race_id", input.race_id)
            .order("bib_number", { ascending: false })
            .limit(1)
            .single()

        if (maxBibError && maxBibError.code !== "PGRST116")
            throw new Error(maxBibError.message)

        bibNumber = maxBibData?.bib_number ? maxBibData.bib_number + 1 : 1
    }

    const { data, error } = await supabase
        .from("race_participants")
        .insert([{ ...input, bib_number: bibNumber }])
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

interface RemoveParticipantInput {
    race_id: string
    user_id: string
}

export const removeParticipant = async (input: RemoveParticipantInput) => {
    const { data: existing, error: fetchError } = await supabase
        .from("race_participants")
        .select("*")
        .eq("race_id", input.race_id)
        .eq("user_id", input.user_id)
        .single()

    if (fetchError && fetchError.code !== "PGRST116")
        throw new Error(fetchError.message)
    if (!existing) throw new Error("You are not a participant in this race.")

    const { data, error } = await supabase
        .from("race_participants")
        .delete()
        .eq("race_id", input.race_id)
        .eq("user_id", input.user_id)
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
