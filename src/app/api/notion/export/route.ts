import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const notionToken = cookies().get('notion_token')?.value

  if (!notionToken) {
    return NextResponse.json({ error: 'Not authenticated with Notion' }, { status: 401 })
  }

  try {
    const { feature, tasks, result, startDate, databaseId } = await request.json()

    if (!databaseId) {
      return NextResponse.json({ error: 'No database ID provided' }, { status: 400 })
    }

    const notion = new Client({ auth: notionToken })

    // Extraire la date de livraison et le total des jours
    const deliveryDate = result.match(/Livraison estimée\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
    const totalDays = result.match(/total de (\d+) jours?/i)?.[1]

    // Créer la page dans Notion
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: feature
              }
            }
          ]
        },
        'Date de démarrage': {
          date: {
            start: startDate
          }
        },
        'Date de livraison': {
          date: {
            start: deliveryDate
          }
        },
        'Durée estimée': {
          number: parseInt(totalDays || '0')
        }
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Tâches techniques' } }]
          }
        },
        ...tasks.map((task: string) => ({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: task } }]
          }
        })),
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: 'Résumé' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: result } }]
          }
        }
      ]
    })

    return NextResponse.json({ success: true, pageId: response.id })
  } catch (error) {
    console.error('Notion export error:', error)
    return NextResponse.json({ error: 'Failed to export to Notion' }, { status: 500 })
  }
} 