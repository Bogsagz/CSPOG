import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PublicHoliday {
  date: string;
  name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting public holiday sync...')

    // Get UK public holidays from app_settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'uk_public_holidays')
      .single()

    if (settingsError) {
      throw new Error(`Failed to fetch holidays: ${settingsError.message}`)
    }

    const holidays = settings.setting_value as PublicHoliday[]
    console.log(`Found ${holidays.length} public holidays`)

    // Get current date and date 1 year ahead
    const today = new Date()
    const oneYearAhead = new Date()
    oneYearAhead.setFullYear(today.getFullYear() + 1)

    // Filter holidays that are upcoming (within the next year)
    const upcomingHolidays = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date)
      return holidayDate >= today && holidayDate <= oneYearAhead
    })

    console.log(`Found ${upcomingHolidays.length} upcoming holidays`)

    // Get all active (non-disabled) users
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('disabled', false)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`Found ${users?.length || 0} active users`)

    let created = 0
    let skipped = 0

    // For each holiday and each user, create an absence entry if it doesn't exist
    for (const holiday of upcomingHolidays) {
      for (const user of users || []) {
        // Check if absence already exists
        const { data: existing } = await supabaseClient
          .from('team_leave')
          .select('id')
          .eq('user_id', user.id)
          .eq('start_date', holiday.date)
          .eq('absence_type', 'public_holiday')
          .maybeSingle()

        if (existing) {
          skipped++
          continue
        }

        // Create new public holiday absence
        const { error: insertError } = await supabaseClient
          .from('team_leave')
          .insert({
            user_id: user.id,
            project_id: null, // Org-wide absence
            start_date: holiday.date,
            end_date: holiday.date,
            absence_type: 'public_holiday',
            description: holiday.name
          })

        if (insertError) {
          console.error(`Failed to create absence for user ${user.id}, holiday ${holiday.name}:`, insertError)
          // Continue with next user instead of failing completely
          continue
        }

        created++
      }
    }

    console.log(`Sync complete. Created: ${created}, Skipped: ${skipped}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Public holiday sync complete`,
        stats: {
          holidays: upcomingHolidays.length,
          users: users?.length || 0,
          created,
          skipped
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error syncing public holidays:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
