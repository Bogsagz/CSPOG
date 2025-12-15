import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Word list for password generation
const words = [
  "apple", "banana", "cherry", "dragon", "eagle", "falcon", "garden", "happy", "island", "jungle",
  "kitten", "lemon", "mountain", "nature", "ocean", "palace", "queen", "river", "sunset", "tiger",
  "unicorn", "valley", "wizard", "yellow", "zenith", "anchor", "bright", "castle", "diamond", "ember",
  "forest", "golden", "harbor", "iron", "jasper", "knight", "lotus", "meadow", "noble", "orchid",
  "phoenix", "quartz", "rainbow", "silver", "thunder", "ultra", "violet", "winter", "xylophone", "yoga"
];

function generatePassword(): string {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the requesting user is a security admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['security_admin', 'security_delivery']);

    if (!roles || roles.length === 0) {
      throw new Error('Only security admins can reset passwords');
    }

    const { userId } = await req.json();
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Generate new password
    const newPassword = generatePassword();

    // Update user password and require password change on next login
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        password: newPassword,
        user_metadata: {
          password_reset_required: true
        }
      }
    );

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        newPassword: newPassword 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error resetting password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});