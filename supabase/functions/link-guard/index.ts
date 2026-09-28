/// <reference path="../deno.d.ts" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, language = 'en' } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hostname = parsed.hostname.toLowerCase();
    const isSuspiciousTld = /\.(xyz|top|live|click|work|icu|buzz|rest|lat|fit|tk|ml|ga|cf|gq)$/i.test(hostname);
    const isIpHost = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);

    const isHighRisk = isSuspiciousTld || isIpHost;

    const result = {
      risk_level: isHighRisk ? 'HIGH' : 'CAUTION',
      category: isHighRisk ? 'High-Risk / Suspicious Web Domain' : 'Unverified External Domain',
      summary: `Inspected domain "${hostname}". Target site was evaluated without rendering in client browser.`,
      warning_signals: isHighRisk
        ? ['High-risk TLD or raw IP address used as web host.', 'Commonly used in temporary phishing campaigns.']
        : ['Always verify address bar matches your intended bank or service.'],
      evidence: [`Hostname: ${hostname}`, `Protocol: ${parsed.protocol}`],
      recommended_actions: [
        'Do not enter banking credentials, passwords, or personal details.',
        'Navigate to the organization by typing their known official address directly.',
      ],
      do_not_do: ['DO NOT download files ending in .apk or .exe from unverified links.'],
      technical_indicators: [`Protocol: ${parsed.protocol}`, `Host: ${hostname}`],
      confidence: 'HIGH',
      limitations: 'Advisory analysis performed via sandboxed heuristic checks.',
      language,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
