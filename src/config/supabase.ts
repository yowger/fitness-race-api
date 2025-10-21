import { createClient } from "@supabase/supabase-js"

import { ENV } from "./env"

export const supabase = createClient(ENV.SUPABASE.URL, ENV.SUPABASE.KEY)
