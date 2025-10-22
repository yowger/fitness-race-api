import dotenv from "dotenv"
dotenv.config()

export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 4000,
    SUPABASE: {
        URL: process.env.SUPABASE_URL!,
        KEY: process.env.SUPABASE_KEY!,
        SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        CONNECTION_STRING: process.env.SUPABASE_CONNECTION_STRING!,
    },
}
