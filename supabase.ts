import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://supabase.co";
const supabaseKey = "sb_publishable_llzVd0-Do_mq7ahXiiSABA_QSxdSvEu";

export const supabase = createClient(supabaseUrl, supabaseKey);
