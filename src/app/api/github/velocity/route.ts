import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('github_access_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo') || process.env.GITHUB_REPO;
  const owner = searchParams.get('owner') || process.env.GITHUB_OWNER;
  if (!repo || !owner) {
    return NextResponse.json({ error: 'GITHUB_REPO or GITHUB_OWNER not set' }, { status: 500 });
  }
  // Récupérer les 100 derniers tickets (issues)
  const issuesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=closed&per_page=100`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
  });
  const issues = await issuesRes.json();
  // Filtrer les PRs et ne garder que les issues fermées avec une date de fermeture
  const closedIssues = (Array.isArray(issues) ? issues : [])
    .filter((i: any) => !i.pull_request && i.closed_at && i.created_at)
    .map((i: any) => ({
      created_at: i.created_at,
      closed_at: i.closed_at,
    }));
  if (closedIssues.length === 0) {
    return NextResponse.json({ avgPerWeek: 0, avgDuration: 0, totalClosed: 0, weeksAnalyzed: 0 });
  }
  // Calculer la période analysée (en semaines)
  const dates = closedIssues.map(i => new Date(i.closed_at));
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weeks = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / msPerWeek));
  // Nombre moyen de tickets fermés/semaine
  const avgPerWeek = closedIssues.length / weeks;
  // Durée moyenne de résolution (en jours)
  const avgDuration = closedIssues.reduce((sum, i) => {
    const created = new Date(i.created_at).getTime();
    const closed = new Date(i.closed_at).getTime();
    return sum + (closed - created) / (1000 * 60 * 60 * 24);
  }, 0) / closedIssues.length;
  return NextResponse.json({ avgPerWeek, avgDuration, totalClosed: closedIssues.length, weeksAnalyzed: weeks });
} 