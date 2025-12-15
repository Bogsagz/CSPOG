import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      throw new Error('Unauthorized');
    }

    // Verify user has security_admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['security_admin', 'security_delivery']);

    if (rolesError) {
      console.error('Error checking user roles:', rolesError.message);
      throw new Error('Failed to verify permissions');
    }

    if (!roles || roles.length === 0) {
      console.error('User does not have required admin role:', user.id);
      throw new Error('Only security admins can perform backup/restore operations');
    }

    console.log('User authorized for backup/restore:', user.id);

    const { action, backup } = await req.json();

    if (action === 'backup') {
      console.log('Creating backup...');
      
      // Define tables to backup
      const tables = [
        'profiles',
        'projects',
        'project_members',
        'project_deliverable_assignments',
        'project_time_allocation',
        'user_deliverables',
        'saved_threats',
        'saved_risks',
        'security_controls',
        'threat_controls',
        'risk_appetite',
        'table_items',
        'team_leave',
        'app_settings',
        'user_roles'
      ];

      const backupData: Record<string, any[]> = {};

      // Fetch all data from each table
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          backupData[table] = [];
        } else {
          backupData[table] = data || [];
          console.log(`Backed up ${data?.length || 0} records from ${table}`);
        }
      }

      return new Response(
        JSON.stringify({
          backup: {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: backupData
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'restore') {
      console.log('Restoring backup...');
      
      if (!backup || !backup.data) {
        throw new Error('Invalid backup format');
      }

      let totalRestored = 0;
      const tables = Object.keys(backup.data);

      // Restore data to each table
      for (const table of tables) {
        const records = backup.data[table];
        if (!records || records.length === 0) continue;

        console.log(`Restoring ${records.length} records to ${table}...`);

        // Insert records in batches
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          const { error } = await supabase
            .from(table)
            .upsert(batch, { onConflict: 'id' });

          if (error) {
            console.error(`Error restoring to ${table}:`, error);
          } else {
            totalRestored += batch.length;
          }
        }
      }

      console.log(`Restore completed. Total records restored: ${totalRestored}`);

      return new Response(
        JSON.stringify({
          success: true,
          restored: totalRestored,
          message: 'Backup restored successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
