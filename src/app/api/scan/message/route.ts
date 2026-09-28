import { NextRequest, NextResponse } from 'next/server';
import { analyzeScamMessage } from '@/lib/scanners/messageScanner';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, language = 'en' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `You are the core analysis engine of FRAUD LOCK (a production cybersecurity and anti-fraud advisory app).
Analyze the following user-submitted message for scam/fraud indicators:
"""
${text}
"""
Language to respond in: ${language}

CRITICAL RULES:
1. Never promise 100% fraud protection.
2. Label confidence as an AI risk indicator, not a guarantee.
3. Never accuse a person of a crime or identify a scammer by personal name.
4. Output STRICT JSON conforming EXACTLY to this schema:
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
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            const parsed = JSON.parse(candidateText);
            return NextResponse.json(parsed);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local heuristics engine:', geminiError);
      }
    }

    // Heuristics engine fallback
    const result = await analyzeScamMessage(text, language);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /scan/message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
