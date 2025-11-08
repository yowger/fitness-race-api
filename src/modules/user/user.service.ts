import { supabase } from "../../config/supabase"

export interface CreateUserInput {
    id: string // this should be the Auth UID from client
    email: string
    fullName: string
    username?: string
    avatar_url?: string
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
    username,
    avatar_url,
}: CreateUserInput) => {
    const { data, error } = await supabase
        .from("users")
        .insert([
            {
                id,
                email,
                full_name: fullName,
                username,
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
