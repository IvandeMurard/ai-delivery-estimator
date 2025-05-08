import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('github_access_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 });
  }
  // Permettre de passer owner et repo en query string
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo') || process.env.GITHUB_REPO;
  const owner = searchParams.get('owner') || process.env.GITHUB_OWNER;
  if (!repo || !owner) {
    return NextResponse.json({ error: 'GITHUB_REPO or GITHUB_OWNER not set' }, { status: 500 });
  }
  // Récupérer les tickets (100 derniers)
  const issuesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`, {
    headers: { Authorization: `Bearer ${token}`, 'Accept': 'application/vnd.github+json' },
  });
  const issues = await issuesRes.json();
  // Filtrer les PRs
  const filtered = (Array.isArray(issues) ? issues : []).filter((i: any) => !i.pull_request).map((i: any) => ({
    title: i.title,
    created_at: i.created_at,
    closed_at: i.closed_at,
    state: i.state,
    number: i.number,
  }));
  return NextResponse.json({ tickets: filtered });
} 