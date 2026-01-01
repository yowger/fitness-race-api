import { supabase } from "../../config/supabase"

interface CreateRaceInput {
    name: string
    price?: number
    banner_url?: string
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
    userId?: string
    name?: string
    createdBy?: string
    status?: "upcoming" | "ongoing" | "finished"
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
}

export interface RaceRoute {
    id: string
    name: string
    distance?: number
    map_url?: string
}

export interface RaceCreator {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
}

export interface RaceParticipant {
    user_id: string
    bib_number?: number
    joined_at?: string
}

export interface Race {
    id: string
    name: string
    description?: string | null
    start_time: string
    end_time?: string | null
    max_participants: number
    route_id?: string | null
    routes?: RaceRoute | null
    created_by?: string | null
    created_by_user?: RaceCreator | null
    participants: RaceParticipant[]
    status: "upcoming" | "ongoing" | "finished" | "complete"
    created_at: string
    updated_at: string
}

export const createRace = async (input: CreateRaceInput) => {
    const { data, error } = await supabase
        .from("group_races")
        .insert([
            {
                name: input.name,
                price: input.price,
                banner_url: input.banner_url,
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

export const getAllRaces = async (
    filters?: GetAllRacesFilters
): Promise<Race[]> => {
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
        const now = new Date()
        if (filters.status === "upcoming") {
            // const yesterday = new Date(
            //     now.getTime() - 24 * 60 * 60 * 1000
            // ).toISOString()
            query = query.eq("status", "upcoming")
            // .gte("start_time", yesterday)
        } else if (filters.status === "ongoing") {
            query = query.eq("status", "ongoing")
        } else if (filters.status === "finished") {
            query = query.eq("status", "finished")
        }
    }

    if (filters?.userId) {
        const { data: participantRaces } = await supabase
            .from("race_participants")
            .select("race_id")
            .eq("user_id", filters.userId)

        const raceIds = participantRaces?.map((r) => r.race_id) || []
        query = query.in("id", raceIds)
    }

    if (filters?.createdBy) {
        query = query.eq("created_by", filters.createdBy)
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
        .select(
            `
            *,
            users ( full_name )
        `
        )
        .eq("race_id", raceId)
        .order("recorded_at", { ascending: true })

    if (userId) query = query.eq("user_id", userId)

    const { data: tracking, error: trackingError } = await query
    if (trackingError) throw new Error(trackingError.message)
    if (!tracking) return []

    const { data: participants, error: participantsError } = await supabase
        .from("race_participants")
        .select("user_id, bib_number")
        .eq("race_id", raceId)

    if (participantsError) throw new Error(participantsError.message)

    const merged = tracking.map((t) => {
        const p = participants?.find((p) => p.user_id === t.user_id)
        return {
            ...t,
            bib_number: p?.bib_number ?? 0,
        }
    })

    return merged
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
    const { data: results, error: resultsError } = await supabase
        .from("race_results")
        .select("*, users(id, full_name, email)")
        .eq("race_id", raceId)

    if (resultsError) throw new Error(resultsError.message)

    const { data: participants, error: participantsError } = await supabase
        .from("race_participants")
        .select("user_id, bib_number, users(id, full_name, email)")
        .eq("race_id", raceId)

    if (participantsError) throw new Error(participantsError.message)

    const merged = participants.map((p) => {
        const r = results.find((r) => r.user_id === p.user_id)

        return {
            race_id: raceId,
            user_id: p.user_id,
            bib_number: p.bib_number,
            users: r?.users ?? p.users,
            finish_time: r?.finish_time ?? null,
            status: r ? "Finished" : "DNF",
            position: r?.position ?? null,
        }
    })

    const sorted = merged.sort((a, b) => {
        if (a.finish_time == null) return 1
        if (b.finish_time == null) return -1
        return a.finish_time - b.finish_time
    })

    return sorted
}

export const startRace = async (raceId: string, userId: string) => {
    const { data: race, error: raceError } = await supabase
        .from("group_races")
        .select("created_by, status")
        .eq("id", raceId)
        .single()

    if (raceError) throw new Error(raceError.message)
    if (!race) throw new Error("Race not found")
    if (race.created_by !== userId)
        throw new Error("Only host can start the race")
    if (race.status !== "upcoming") throw new Error("Race already started")

    const { data, error } = await supabase
        .from("group_races")
        .update({
            actual_start_time: new Date().toISOString(),
            status: "ongoing",
        })
        .eq("id", raceId)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const endRace = async (raceId: string, userId: string) => {
    const { data: race, error: raceError } = await supabase
        .from("group_races")
        .select("created_by, status")
        .eq("id", raceId)
        .single()

    if (raceError) throw new Error(raceError.message)
    if (!race) throw new Error("Race not found")
    if (race.created_by !== userId)
        throw new Error("Only host can end the race")
    if (race.status !== "ongoing") throw new Error("Race is not ongoing")

    const { data, error } = await supabase
        .from("group_races")
        .update({
            actual_end_time: new Date().toISOString(),
            status: "finished",
        })
        .eq("id", raceId)
        .select()
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const completeRace = async (raceId: string, userId: string) => {
    const { data: race, error: raceError } = await supabase
        .from("group_races")
        .select("created_by, status")
        .eq("id", raceId)
        .single()

    if (raceError) throw raceError
    if (!race) throw new Error("Race not found")
    if (race.created_by !== userId)
        throw new Error("Only host can complete the race")

    if (race.status !== "finished")
        throw new Error("Race must be finished before completing")

    const { error } = await supabase
        .from("group_races")
        .update({
            status: "complete",
            updated_at: new Date().toISOString(),
        })
        .eq("id", raceId)

    if (error) throw error
}

type RaceResultStatus =
    | "Finished"
    | "DNF"
    | "DNS"
    | "Disqualified"
    | "Did Not Join"

interface UpdateResultBatchInput {
    user_id: string
    position?: number | null
    status?: RaceResultStatus
    finish_time?: number | null
}

export const publishRaceResults = async (
    updates: UpdateResultBatchInput[],
    raceId: string,
    userId: string
) => {
    const payload = updates.map((u) => ({
        race_id: raceId,
        user_id: u.user_id,
        position: u.position ?? null,
        status: u.status,
        finish_time: u.finish_time ?? null,
    }))

    const { error: resultsError } = await supabase
        .from("race_results")
        .upsert(payload, {
            onConflict: "race_id,user_id",
        })

    if (resultsError) throw resultsError

    const { error: raceError } = await supabase
        .from("group_races")
        .update({
            status: "complete",
            updated_at: new Date().toISOString(),
        })
        .eq("id", raceId)
        .eq("created_by", userId)

    if (raceError) throw raceError
}

interface UpdateBibInput {
    race_id: string
    user_id: string
    bib_number: number
}

export const updateParticipantBib = async (params: {
    race_id: string
    user_id: string
    bib_number: number
}) => {
    const { race_id, user_id, bib_number } = params
    console.log("🚀 ~ updateParticipantBib ~ bib_number:", bib_number)
    console.log("🚀 ~ updateParticipantBib ~ user_id:", user_id)
    console.log("🚀 ~ updateParticipantBib ~ race_id:", race_id)

    const { data: existing, error: existingError } = await supabase
        .from("race_participants")
        .select("id")
        .eq("race_id", race_id)
        .eq("bib_number", bib_number)
        .maybeSingle()

    if (existing) {
        console.log("🚀 ~ updateParticipantBib ~ existing:", existing)
        throw new Error(`Bib number ${bib_number} is already assigned`)
    }
    if (existingError) {
        console.log("🚀 ~ updateParticipantBib ~ existingError:", existingError)
        throw new Error(existingError.message)
    }

    const { data, error } = await supabase
        .from("race_participants")
        .update({ bib_number })
        .eq("race_id", race_id)
        .eq("user_id", user_id)
        .select()
        .maybeSingle()

    console.log("🚀 ~ updateParticipantBib ~ data:", data)

    if (error) throw new Error(error.message)
    return data
}

type GroupRaceStatus = "upcoming" | "ongoing" | "finished" | "complete"

interface GetRunnerResultsPaginatedParams {
    runnerUserId: string
    status?: GroupRaceStatus
    limit?: number
    offset?: number
}

interface RunnerResultsPaginatedResponse {
    results: {
        race_id: string
        bib_number: number | null
        total_participants: number
        race: {
            id: string
            name: string
            description?: string
            banner_url?: string
            start_time: string
            end_time?: string
            created_by?: string
            route?: {
                id: string
                name: string
                description?: string
                distance?: number
                start_address?: string
                end_address?: string
            } | null
        }
        result: {
            finish_time: number | null
            position: number | null
            status: string
        }
    }[]
    totalRaces: number
}

export const getRunnerResultsPaginated = async ({
    runnerUserId,
    status,
    limit = 10,
    offset = 0,
}: GetRunnerResultsPaginatedParams) => {
    if (!runnerUserId) {
        throw new Error("runnerUserId is required")
    }

    let participantsQuery = supabase
        .from("race_participants")
        .select(
            `
            race_id,
            bib_number,
            joined_at,
            group_races (
                id,
                name,
                description,
                banner_url,
                start_time,
                end_time,
                created_by,
                status,
                routes (
                    id,
                    name,
                    description,
                    distance,
                    start_address,
                    end_address
                )
            )
            `,
            { count: "exact" }
        )
        .eq("user_id", runnerUserId)
        .order("joined_at", { ascending: false })
        .range(offset, offset + limit - 1)

    if (status) {
        participantsQuery = participantsQuery.eq("group_races.status", status)
    }

    const {
        data: participants,
        count,
        error: participantsError,
    } = await participantsQuery

    if (participantsError) {
        throw new Error(participantsError.message)
    }

    if (!participants || participants.length === 0) {
        return {
            results: [],
            totalRaces: count ?? 0,
        }
    }

    const { data: raceResults, error: resultsError } = await supabase
        .from("race_results")
        .select("race_id, finish_time, position, status")
        .eq("user_id", runnerUserId)

    if (resultsError) {
        throw new Error(resultsError.message)
    }

    const raceIds = participants.map((p) => p.race_id)

    const { data: participantCounts, error: countError } = await supabase
        .from("race_participants")
        .select("race_id")
        .in("race_id", raceIds)

    if (countError) {
        throw new Error(countError.message)
    }

    const participantsCountMap = (participantCounts ?? []).reduce<
        Record<string, number>
    >((acc, row) => {
        acc[row.race_id] = (acc[row.race_id] ?? 0) + 1
        return acc
    }, {})

    const mergedResults = participants.map((p) => {
        const r = raceResults?.find((res) => res.race_id === p.race_id)

        return {
            race_id: p.race_id,
            bib_number: p.bib_number ?? null,
            total_participants: participantsCountMap[p.race_id] ?? 0,
            race: {
                ...p.group_races,
            },
            result: {
                finish_time: r?.finish_time ?? null,
                position: r?.position ?? null,
                status: r?.status ?? "DNF",
            },
        }
    })

    return {
        results: mergedResults,
        totalRaces: count ?? 0,
    }
}

interface RunnerProfileStats {
    totalRaces: number
    totalDistance: string
    totalTime: string
    averagePace: string
}

export const getRunnerProfileStats = async (
    userId: string
): Promise<RunnerProfileStats> => {
    if (!userId) throw new Error("userId is required")

    const { data, error } = await supabase
        .from("race_results")
        .select(
            `
            finish_time,
            group_races (
                routes ( distance )
            )
        `
        )
        .eq("user_id", userId)
        .eq("status", "Finished")

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
        return {
            totalRaces: 0,
            totalDistance: "0 km",
            totalTime: "0:00:00",
            averagePace: "— /km",
        }
    }

    let totalDistance = 0
    let totalTime = 0

    data.forEach((r) => {
        const groupRace = r.group_races?.[0]
        const route = groupRace?.routes?.[0]

        const distance = route?.distance ?? 0
        const time = r.finish_time ?? 0

        totalDistance += Number(distance)
        totalTime += Number(time)
    })

    const totalRaces = data.length

    return {
        totalRaces,
        totalDistance: formatKm(totalDistance),
        totalTime: formatDuration(totalTime),
        averagePace: formatPace(totalTime, totalDistance),
    }
}

const formatKm = (km: number) => `${km.toFixed(1)} km`

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const formatPace = (seconds: number, km: number) => {
    if (km === 0) return "— /km"
    const pace = Math.floor(seconds / km)
    const m = Math.floor(pace / 60)
    const s = pace % 60
    return `${m}:${String(s).padStart(2, "0")} /km`
}
