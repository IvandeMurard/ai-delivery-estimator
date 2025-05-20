import { NextRequest, NextResponse } from 'next/server';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;

export async function GET(req: NextRequest) {
  if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    return NextResponse.json({ error: 'Trello API non configurée.' }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const listId = searchParams.get('listId') || TRELLO_LIST_ID;
  if (!listId) {
    return NextResponse.json({ error: 'Aucune liste Trello spécifiée.' }, { status: 400 });
  }
  // Récupérer les cartes archivées (closed) de la liste
  const url = `https://api.trello.com/1/lists/${listId}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,dateLastActivity,closed,idList&filter=closed`;
  const cardsRes = await fetch(url);
  const cards = await cardsRes.json();
  // Ne garder que les cartes fermées avec une date de création et de fermeture
  const closedCards = (Array.isArray(cards) ? cards : []).filter((c: { closed: boolean; dateLastActivity?: string }) => c.closed && c.dateLastActivity);
  if (closedCards.length === 0) {
    return NextResponse.json({ avgPerWeek: 0, avgDuration: 0, totalClosed: 0, weeksAnalyzed: 0 });
  }
  // Pour Trello, on n'a pas la date de création directement, mais on peut l'estimer à partir de l'ID (les 8 premiers caractères = timestamp en hex)
  function getCreatedAtFromId(id: string) {
    // https://help.trello.com/article/759-getting-the-time-a-card-or-board-was-created
    return new Date(parseInt(id.substring(0,8), 16) * 1000);
  }
  const cardsWithDates = closedCards.map((c: { closed: boolean; id: string; dateLastActivity?: string }) => ({
    created_at: getCreatedAtFromId(c.id),
    closed_at: new Date(c.dateLastActivity)
  }));
  // Calculer la période analysée (en semaines)
  const dates = cardsWithDates.map(i => i.closed_at);
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeks = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / msPerWeek));
  // Nombre moyen de cartes fermées/semaine
  const avgPerWeek = cardsWithDates.length / weeks;
  // Durée moyenne de résolution (en jours)
  const avgDuration = cardsWithDates.reduce((sum, i) => {
    const created = i.created_at.getTime();
    const closed = i.closed_at.getTime();
    return sum + (closed - created) / (1000 * 60 * 60 * 24);
  }, 0) / cardsWithDates.length;
  return NextResponse.json({ avgPerWeek, avgDuration, totalClosed: cardsWithDates.length, weeksAnalyzed: weeks });
} 