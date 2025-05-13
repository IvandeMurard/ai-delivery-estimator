import { NextRequest, NextResponse } from 'next/server';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID; // fallback

export async function POST(req: NextRequest) {
  try {
    if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
      return NextResponse.json({ error: 'Trello API non configurée.' }, { status: 500 });
    }
    const { tasks, listId } = await req.json();
    const targetListId = listId || TRELLO_LIST_ID;
    if (!Array.isArray(tasks) || tasks.length === 0 || !targetListId) {
      return NextResponse.json({ error: 'Aucune tâche ou liste à exporter.' }, { status: 400 });
    }
    // Pour chaque tâche, créer une carte Trello
    const results = await Promise.all(tasks.map(async (task: any) => {
      const name = task.name || task.titre || task.title || 'Tâche';
      const desc = `Durée estimée : ${task.duration || task.estimation || '—'}\nDate de livraison : ${task.deliveryDate || ''}`;
      const url = `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idList: targetListId,
          name,
          desc,
        })
      });
      if (!res.ok) throw new Error('Erreur Trello');
      return true;
    }));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Échec de l\'export Trello.' }, { status: 500 });
  }
} 