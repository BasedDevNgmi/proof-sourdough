import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type BakeSession = {
  id: string
  recipe_id: string
  book_id: string
  started_at: string
  completed_at: string | null
  status: 'in-progress' | 'completed' | 'abandoned'
  overall_rating: number | null
  crumb_rating: number | null
  crust_rating: number | null
  flavor_rating: number | null
  ambient_temp_f: number | null
  humidity_percent: number | null
  dough_temp_f: number | null
  flour_brand: string | null
  flour_notes: string | null
  starter_notes: string | null
  starter_hydration: string | null
  what_went_well: string | null
  what_to_improve: string | null
  overall_notes: string | null
  modifications: string | null
  bulk_fermentation_hours: number | null
  proof_hours: number | null
  bake_time_minutes: number | null
  bake_temp_f: number | null
  created_at: string
  updated_at: string
}

export type BakeStepLog = {
  id: string
  session_id: string
  step_number: number
  step_title: string
  started_at: string
  completed_at: string | null
  notes: string | null
  temperature_reading: number | null
  photo_url: string | null
  created_at: string
}

export type BakePhoto = {
  id: string
  session_id: string
  photo_url: string
  caption: string | null
  stage: string | null
  created_at: string
}
