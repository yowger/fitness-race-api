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
    const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName },
        })

    if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create auth user")
    }

    const authUserId = authData.user.id

    const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([{ id: authUserId, full_name: fullName, email }])
        .select()
        .single()

    if (userError || !userData) {
        throw new Error(userError?.message || "Failed to create app user")
    }

    return userData
}

