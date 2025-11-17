import { supabase } from "../../config/supabase"

export type Position = [number, number]

export interface LineString {
    type: "LineString"
    coordinates: Position[]
}

export interface Feature<T = LineString> {
    type: "Feature"
    geometry: T
}

export interface FeatureCollection<T = LineString> {
    type: "FeatureCollection"
    features: Feature<T>[]
}

export interface CreateRouteInput {
    name: string
    description?: string
    distance?: number
    geojson: FeatureCollection<LineString>
    createdBy?: string
}

export interface RouteResponse {
    id: string
    name: string
    description?: string
    distance?: number
    geojson: FeatureCollection<LineString>
    created_by?: string
    created_at?: string
}

export const getAllRoutes = async (): Promise<RouteResponse[]> => {
    const { data, error } = await supabase
        .from("routes")
        .select("id, name, description, distance, created_by, created_at")

    if (error) throw new Error(error.message)
    return data as RouteResponse[]
}

export const getRouteById = async (id: string): Promise<RouteResponse> => {
    const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data as RouteResponse
}

export const createRoute = async (
    input: CreateRouteInput
): Promise<RouteResponse> => {
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
    return data as RouteResponse
}

export const deleteRoute = async (id: string): Promise<void> => {
    const { error } = await supabase.from("routes").delete().eq("id", id)
    if (error) throw new Error(error.message)
}
