import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FEEDBACK_PATH = path.join(process.cwd(), 'feedbacks.json');

export async function GET() {
  try {
    const content = await fs.readFile(FEEDBACK_PATH, 'utf-8');
    const feedbacks = JSON.parse(content);
    // On ne garde que les feedbacks avec un score NPS valide
    const npsFeedbacks = feedbacks
      .filter((f: any) => typeof f.nps === 'number')
      .map((f: any) => ({
        feature: f.feature || '',
        npsScore: f.nps,
        date: f.date,
        comment: f.comment || ''
      }));
    return NextResponse.json({ feedbacks: npsFeedbacks });
  } catch {
    return NextResponse.json({ feedbacks: [] });
  }
} 