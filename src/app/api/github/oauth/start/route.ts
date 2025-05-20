import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_OAUTH_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID or GITHUB_OAUTH_CALLBACK_URL not set' }, { status: 500 });
  }
  const scope = 'repo';
  const state = Math.random().toString(36).substring(2); // simple anti-CSRF
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  return NextResponse.redirect(githubAuthUrl);
} 