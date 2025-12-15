import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    // Simple CSV parser - handles basic cases
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    return values;
  });
}

async function importUsers(
  supabaseAdmin: any,
  rows: string[][]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  if (rows.length < 2) {
    result.errors.push({ row: 0, error: "No data rows found" });
    result.errorCount = 1;
    result.success = false;
    return result;
  }

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const requiredHeaders = ['email', 'first_name', 'last_name'];
  
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      result.errors.push({ row: 0, error: `Missing required column: ${required}` });
      result.errorCount = 1;
      result.success = false;
      return result;
    }
  }

  const emailIndex = headers.indexOf('email');
  const firstNameIndex = headers.indexOf('first_name');
  const lastNameIndex = headers.indexOf('last_name');
  const workstreamIndex = headers.indexOf('workstream');
  const primaryRoleIndex = headers.indexOf('primary_role');
  const sfiaGradeIndex = headers.indexOf('sfia_grade');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    try {
      const email = row[emailIndex]?.trim();
      if (!email) {
        result.errors.push({ row: rowNumber, error: "Email is required" });
        result.errorCount++;
        continue;
      }

      // Create auth user with a temporary password
      const tempPassword = crypto.randomUUID();
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: row[firstNameIndex]?.trim() || '',
          last_name: row[lastNameIndex]?.trim() || ''
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          result.errors.push({ row: rowNumber, error: `Duplicate: User with email "${email}" already exists` });
        } else {
          result.errors.push({ row: rowNumber, error: `Auth error: ${authError.message}` });
        }
        result.errorCount++;
        continue;
      }

      // Update profile with additional data
      const profileUpdate: any = {
        first_name: row[firstNameIndex]?.trim() || null,
        last_name: row[lastNameIndex]?.trim() || null,
      };

      if (workstreamIndex >= 0 && row[workstreamIndex]) {
        profileUpdate.workstream = mapWorkstreamValue(row[workstreamIndex].trim());
      }
      if (primaryRoleIndex >= 0 && row[primaryRoleIndex]) {
        profileUpdate.primary_role = row[primaryRoleIndex].trim();
      }
      if (sfiaGradeIndex >= 0 && row[sfiaGradeIndex]) {
        const grade = parseInt(row[sfiaGradeIndex].trim());
        if (!isNaN(grade)) {
          profileUpdate.sfia_grade = grade;
        }
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`Profile update error for row ${rowNumber}:`, profileError);
        result.errors.push({ row: rowNumber, error: `Profile error: ${profileError.message}` });
        result.errorCount++;
        continue;
      }

      result.successCount++;
    } catch (error: any) {
      result.errors.push({ row: rowNumber, error: error.message });
      result.errorCount++;
    }
  }

  result.success = result.errorCount === 0;
  return result;
}

// Map workstream names to database enum values
function mapWorkstreamValue(workstream: string): string {
  const mapping: Record<string, string> = {
    'migration': 'Mig',
    'mig': 'Mig',
    'ie': 'IE',
    'information environment': 'IE',
    'land': 'Land',
    'sea': 'Sea',
    'platforms': 'Plat',
    'plat': 'Plat'
  };
  return mapping[workstream.toLowerCase()] || workstream;
}

// Parse date in various formats and return YYYY-MM-DD
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const trimmed = dateStr.trim();
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Handle DD/MM/YYYY or MM/DD/YYYY format
  const dateMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dateMatch) {
    const [, first, second, year] = dateMatch;
    const firstNum = parseInt(first);
    const secondNum = parseInt(second);
    
    let day: string;
    let month: string;
    
    // Determine format based on which number is > 12
    if (firstNum > 12) {
      // Must be DD/MM/YYYY (first number is day)
      day = first;
      month = second;
    } else if (secondNum > 12) {
      // Must be MM/DD/YYYY (second number is day)
      month = first;
      day = second;
    } else {
      // Both <= 12, ambiguous - assume DD/MM/YYYY (UK/European format)
      day = first;
      month = second;
    }
    
    // Validate the resulting month and day
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return null;
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

async function importProjects(
  supabase: any,
  userId: string,
  rows: string[][]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    successCount: 0,
    errorCount: 0,
    errors: []
  };

  if (rows.length < 2) {
    result.errors.push({ row: 0, error: "No data rows found" });
    result.errorCount = 1;
    result.success = false;
    return result;
  }

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const requiredHeaders = ['title'];
  
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      result.errors.push({ row: 0, error: `Missing required column: ${required}` });
      result.errorCount = 1;
      result.success = false;
      return result;
    }
  }

  const titleIndex = headers.indexOf('title');
  const workstreamIndex = headers.indexOf('workstream');
  const fleetSizeIndex = headers.indexOf('fleet_size');
  const projectStartIndex = headers.indexOf('project_start');
  const goLiveIndex = headers.indexOf('anticipated_go_live');
  const securityPhaseIndex = headers.indexOf('security_phase');
  const secureByDesignIndex = headers.indexOf('secure_by_design_required');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    try {
      const title = row[titleIndex]?.trim();
      if (!title) {
        result.errors.push({ row: rowNumber, error: "Title is required" });
        result.errorCount++;
        continue;
      }

      // Check for duplicate project title
      const { data: existingProjects, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .ilike('title', title)
        .limit(1);

      if (checkError) {
        result.errors.push({ row: rowNumber, error: `Database error: ${checkError.message}` });
        result.errorCount++;
        continue;
      }

      if (existingProjects && existingProjects.length > 0) {
        result.errors.push({ row: rowNumber, error: `Duplicate: Project "${title}" already exists` });
        result.errorCount++;
        continue;
      }

      const projectData: any = {
        title,
        user_id: userId
      };

      if (workstreamIndex >= 0 && row[workstreamIndex]) {
        projectData.workstream = mapWorkstreamValue(row[workstreamIndex].trim());
      }
      if (fleetSizeIndex >= 0 && row[fleetSizeIndex]) {
        projectData.fleet_size = row[fleetSizeIndex].trim();
      }
      if (projectStartIndex >= 0 && row[projectStartIndex]) {
        const parsedDate = parseDate(row[projectStartIndex].trim());
        if (parsedDate) {
          projectData.project_start = parsedDate;
        } else {
          result.errors.push({ row: rowNumber, error: "Invalid project_start date format. Use DD/MM/YYYY or YYYY-MM-DD" });
          result.errorCount++;
          continue;
        }
      }
      if (goLiveIndex >= 0 && row[goLiveIndex]) {
        const parsedDate = parseDate(row[goLiveIndex].trim());
        if (parsedDate) {
          projectData.anticipated_go_live = parsedDate;
        } else {
          result.errors.push({ row: rowNumber, error: "Invalid anticipated_go_live date format. Use DD/MM/YYYY or YYYY-MM-DD" });
          result.errorCount++;
          continue;
        }
      }
      if (securityPhaseIndex >= 0 && row[securityPhaseIndex]) {
        projectData.security_phase = row[securityPhaseIndex].trim();
      }
      if (secureByDesignIndex >= 0 && row[secureByDesignIndex]) {
        const value = row[secureByDesignIndex].trim().toLowerCase();
        projectData.secure_by_design_required = value === 'true' || value === '1' || value === 'yes';
      }

      const { error: insertError } = await supabase
        .from('projects')
        .insert(projectData);

      if (insertError) {
        result.errors.push({ row: rowNumber, error: `Insert error: ${insertError.message}` });
        result.errorCount++;
        continue;
      }

      result.successCount++;
    } catch (error: any) {
      result.errors.push({ row: rowNumber, error: error.message });
      result.errorCount++;
    }
  }

  result.success = result.errorCount === 0;
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { type, csvData } = await req.json();

    if (!csvData || !type) {
      throw new Error('Missing required fields: type and csvData');
    }

    const rows = parseCSV(csvData);
    let result: ImportResult;

    if (type === 'users') {
      // Verify user has admin privileges before allowing user imports
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['security_admin', 'security_delivery']);
      
      if (!roles || roles.length === 0) {
        console.error(`Unauthorized user import attempt by user: ${user.id}`);
        throw new Error('Only security admins can import users');
      }
      
      console.log(`User import authorized for admin user: ${user.id}`);
      result = await importUsers(supabaseAdmin, rows);
    } else if (type === 'projects') {
      result = await importProjects(supabaseClient, user.id, rows);
    } else {
      throw new Error('Invalid import type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        successCount: 0, 
        errorCount: 1, 
        errors: [{ row: 0, error: error.message }] 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
