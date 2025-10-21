import { supabase } from "../../config/supabase"

export interface CreateUserInput {
    email: string
    password: string
    fullName: string
}

export const getAllUsers = async () => {
    const { data, error } = await supabase
        .from("users")
        .select("id, email, username")

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export const createUser = async ({
    email,
    password,
    fullName,
}: CreateUserInput) => {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
    })

    if (error) {
        throw new Error(error.message)
    }

    return data.user
}

export const signInUser = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data.session?.access_token
}
