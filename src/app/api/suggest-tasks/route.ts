import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { feature } = await req.json();
  if (!feature) {
    return NextResponse.json({ error: 'Feature description required' }, { status: 400 });
  }

  // Appel OpenAI
  const prompt = `Voici une description fonctionnelle : "${feature}". Découpe-la en tâches techniques claires et concises, sans estimation de temps, sous forme de liste.`;

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant expert en gestion de projet technique.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.3,
    }),
  });

  const data = await openaiRes.json();
  const text = data.choices?.[0]?.message?.content || '';
  // Extraction des tâches (liste à puces ou numérotée)
  const tasks = text
    .split(/\n|\r/)
    .map((l: string) => l.replace(/^[-*\d.\s]+/, '').trim())
    .filter((l: string) => l.length > 0);

  return NextResponse.json({ tasks });
} 