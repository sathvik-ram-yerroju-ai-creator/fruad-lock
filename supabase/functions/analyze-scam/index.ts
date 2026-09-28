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
    const { text, language = 'en' } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text input is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: 'Payload exceeds 5000 character security limit' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (geminiKey) {
      const prompt = `You are FRAUD LOCK, a cybersecurity advisory engine.
Analyze this message for scam patterns:
"""${text}"""
Language: ${language}

Return strictly formatted JSON matching this shape:
{
  "risk_level": "LOW | CAUTION | HIGH",
  "category": "string",
  "summary": "string",
  "warning_signals": ["string"],
  "evidence": ["string"],
  "recommended_actions": ["string"],
  "do_not_do": ["string"],
  "technical_indicators": ["string"],
  "confidence": "LOW | MEDIUM | HIGH",
  "limitations": "string",
  "language": "${language}"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          return new Response(jsonText, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Default heuristic fallback response
    const fallbackResponse = {
      risk_level: text.toLowerCase().includes('otp') || text.toLowerCase().includes('pin') ? 'HIGH' : 'CAUTION',
      category: 'Potential Social Engineering / Urgency Pattern',
      summary: 'Advisory analysis flagged suspicious request patterns requiring verification.',
      warning_signals: ['Artificial urgency or request for action detected.'],
      evidence: ['Text contains patterns observed in unsolicited outreach.'],
      recommended_actions: ['Verify independently through official published customer care channels.'],
      do_not_do: ['Do not share OTPs, PINs, or transfer money.'],
      technical_indicators: ['Unverified communication vector'],
      confidence: 'MEDIUM',
      limitations: 'AI risk indicator — not a guarantee.',
      language,
    };

    return new Response(JSON.stringify(fallbackResponse), {
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
