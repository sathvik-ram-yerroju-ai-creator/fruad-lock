import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, language = 'en' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      try {
        const systemInstruction = `You are "Ask Fraud Lock", a dedicated AI safety assistant for a production fraud-prevention application.
GUIDELINES:
1. Answer ONLY from user-provided details and established fraud-prevention principles.
2. Respond in this language: ${language}.
3. When uncertain, say EXACTLY: "I cannot verify this from the available information. Verify through the organization’s official channel."
4. NEVER request or retain OTPs, PINs, passwords, full card numbers, or credentials.
5. If someone lost money, emphasize immediate contact with their bank and Cyber Helpline 1930 within the Golden Hour.
6. Never accuse a specific individual of a crime; describe patterns as "potential scam" or "suspicious activity".`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question:\n${query}` }] },
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            return NextResponse.json({
              response: responseText,
              suggestedActions: [
                'Verify independently through official bank helpline',
                'Do not share passwords or OTPs',
                'Dial 1930 if unauthorized transaction occurred',
              ],
            });
          }
        }
      } catch (geminiError) {
        console.warn('Gemini Assistant call failed, using local safety response:', geminiError);
      }
    }

    // Fallback: Let client local safety knowledge base handle it
    return NextResponse.json({
      fallback: true,
    });
  } catch (error: any) {
    console.error('API /assistant/chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
