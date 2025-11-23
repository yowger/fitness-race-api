import { supabase } from "../../config/supabase"

export interface CreateUserInput {
    id: string
    email: string
    fullName: string
    username?: string
    avatar_url?: string
}

export const getUserById = async (id: string) => {
    const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("id", id)
        .single()

    if (error) throw new Error(error.message)
    return data
}

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, username, avatar_url")

    if (error) throw new Error(error.message)
    return data
}

export const createUser = async ({
    id,
    email,
    fullName,
    avatar_url,
}: CreateUserInput) => {
    const { data, error } = await supabase
        .from("users")
        .insert([
            {
                id,
                email,
                full_name: fullName,
                avatar_url,
            },
        ])
        .select()
        .single()

    if (error || !data) {
        throw new Error(error?.message || "Failed to create app user")
    }

    return data
}
