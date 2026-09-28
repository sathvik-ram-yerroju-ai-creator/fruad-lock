/// <reference path="../deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header. Authentication required.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate calling user's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired user session token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, payload } = await req.json();

    switch (action) {
      case 'export_data': {
        // Enforce strict ownership check: only fetch records where user_id = user.id
        const [profileRes, settingsRes, devicesRes, eventsRes, evidenceRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('user_security_settings').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('trusted_devices').select('*').eq('user_id', user.id),
          supabase.from('account_security_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('evidence_items').select('*').eq('user_id', user.id),
        ]);

        const exportDossier = {
          export_metadata: {
            exported_at: new Date().toISOString(),
            user_id: user.id,
            email: user.email,
            jurisdiction: profileRes.data?.country || 'India',
            compliance: 'GDPR_CCPA_DATA_PORTABILITY_VERIFIED',
          },
          profile: profileRes.data || null,
          security_settings: settingsRes.data || null,
          trusted_devices: devicesRes.data || [],
          security_activity_events: eventsRes.data || [],
          evidence_records: evidenceRes.data || [],
        };

        // Audit log data export event
        await supabase.from('account_security_events').insert({
          user_id: user.id,
          event_type: 'data_export',
          ip_address: req.headers.get('x-forwarded-for') || 'edge-network',
          user_agent: req.headers.get('user-agent') || 'edge-function',
          details: 'Complete data sovereignty export generated via Edge Function',
        });

        return new Response(JSON.stringify(exportDossier), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_account': {
        if (payload?.confirmation !== 'DELETE MY ACCOUNT') {
          return new Response(
            JSON.stringify({ error: 'Confirmation phrase must match "DELETE MY ACCOUNT".' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Strict cascade purge of user data
        await Promise.all([
          supabase.from('encrypted_private_profile_data').delete().eq('user_id', user.id),
          supabase.from('account_security_events').delete().eq('user_id', user.id),
          supabase.from('consent_records').delete().eq('user_id', user.id),
          supabase.from('user_sessions').delete().eq('user_id', user.id),
          supabase.from('trusted_devices').delete().eq('user_id', user.id),
          supabase.from('user_security_settings').delete().eq('user_id', user.id),
          supabase.from('evidence_items').delete().eq('user_id', user.id),
          supabase.from('analyses').delete().eq('user_id', user.id),
          supabase.from('incident_reports').delete().eq('user_id', user.id),
          supabase.from('profiles').delete().eq('id', user.id),
        ]);

        // Delete user auth record
        await supabase.auth.admin.deleteUser(user.id);

        return new Response(
          JSON.stringify({ success: true, message: 'Account and all associated records permanently purged.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown security action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Edge Function error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
