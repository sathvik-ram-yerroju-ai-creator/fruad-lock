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
    const { query, language = 'en' } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    if (geminiKey) {
      const systemPrompt = `You are Fraud Lock Safety Assistant.
RULES:
1. Answer strictly based on verified cybersecurity and anti-fraud best practices.
2. Respond in: ${language}.
3. When uncertain, say EXACTLY: "I cannot verify this from the available information. Verify through the organization’s official channel."
4. Never ask for or store passwords, PINs, OTPs, or card numbers.
5. If money was stolen, recommend contacting their bank and dial 1930 within the Golden Hour.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question:\n${query}` }] },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return new Response(JSON.stringify({ response: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        response: 'I cannot verify this from the available information. Verify through the organization’s official channel.\n\nAlways remember:\n• Never share 6-digit OTPs or banking PINs.\n• Never install AnyDesk or remote apps for customer support.\n• Dial 1930 immediately if an unauthorized transaction occurred.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
