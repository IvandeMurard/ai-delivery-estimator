import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/notion/oauth/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  try {
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    })

    const data = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(data.error_description || 'Failed to get access token')
    }

    // Stocker le token dans les cookies
    const redirectResponse = NextResponse.redirect(new URL('/', request.url))
    redirectResponse.cookies.set('notion_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 jours
    })

    return redirectResponse
  } catch (error) {
    console.error('Notion OAuth error:', error)
    return NextResponse.json({ error: 'Failed to authenticate with Notion' }, { status: 500 })
  }
} 