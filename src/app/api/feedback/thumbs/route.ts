import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { thumb } = await req.json();
  if (thumb !== 'up' && thumb !== 'down') {
    return NextResponse.json({ success: false, error: 'Invalid thumb' }, { status: 400 });
  }
  // Pas de stockage, juste un accusé de réception
  return NextResponse.json({ success: true });
} 