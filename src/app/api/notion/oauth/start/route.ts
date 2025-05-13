import { NextResponse } from 'next/server'

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/notion/oauth/callback'

export async function GET() {
  if (!NOTION_CLIENT_ID) {
    return NextResponse.json({ error: 'NOTION_CLIENT_ID not configured' }, { status: 500 })
  }

  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

  return NextResponse.redirect(notionAuthUrl)
} 