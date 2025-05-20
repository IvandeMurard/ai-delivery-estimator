import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FEEDBACK_PATH = path.join(process.cwd(), 'feedbacks.json');

export async function POST(req: NextRequest) {
  const { feature, nps, comment, date } = await req.json();
  if (!feature || typeof nps !== 'number') {
    return NextResponse.json({ error: 'feature et nps requis' }, { status: 400 });
  }
  let feedbacks: { feature: string; nps: number; comment: string; date: string }[] = [];
  try {
    const content = await fs.readFile(FEEDBACK_PATH, 'utf-8');
    feedbacks = JSON.parse(content);
  } catch {}
  feedbacks.push({ feature, nps, comment, date: date || new Date().toISOString() });
  await fs.writeFile(FEEDBACK_PATH, JSON.stringify(feedbacks, null, 2), 'utf-8');
  return NextResponse.json({ success: true });
}

export async function GET() {
  try {
    const content = await fs.readFile(FEEDBACK_PATH, 'utf-8');
    const feedbacks = JSON.parse(content);
    return NextResponse.json({ feedbacks });
  } catch {
    return NextResponse.json({ feedbacks: [] });
  }
} 