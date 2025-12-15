import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a secure random password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const testUsers = [
      {
        firstName: 'Jack',
        lastName: 'Smith',
        email: 'jack@test.com',
        sfiaGrade: 4,
        primaryRole: 'delivery',
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@test.com',
        sfiaGrade: 4,
        primaryRole: 'delivery',
      },
      {
        firstName: 'Giles',
        lastName: 'Williams',
        email: 'giles@test.com',
        sfiaGrade: 4,
        primaryRole: 'delivery',
      },
    ];

    const results = [];

    for (const user of testUsers) {
      // Generate a secure random password for each user
      const securePassword = generateSecurePassword();
      
      // Create user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: securePassword,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
          password_reset_required: true, // Force password change on first login
        },
      });

      if (authError) {
        results.push({ user: user.email, error: authError.message });
        continue;
      }

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: user.firstName,
          last_name: user.lastName,
          sfia_grade: user.sfiaGrade,
          primary_role: user.primaryRole,
          username: user.email.split('@')[0],
        })
        .eq('id', authData.user.id);

      if (profileError) {
        results.push({ user: user.email, error: profileError.message });
      } else {
        // Note: Password is generated but not returned for security
        results.push({ 
          user: user.email, 
          success: true, 
          id: authData.user.id,
          note: 'User created with temporary password. Password reset required on first login.'
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
