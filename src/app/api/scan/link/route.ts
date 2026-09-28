import { NextRequest, NextResponse } from 'next/server';
import { inspectUrlSafely } from '@/lib/scanners/linkGuard';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, language = 'en' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const result = inspectUrlSafely(url, language);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /scan/link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
