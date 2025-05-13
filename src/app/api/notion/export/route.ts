import { NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const notionToken = cookieStore.get('notion_token')?.value;

  if (!notionToken) {
    return NextResponse.json({ error: 'Not authenticated with Notion' }, { status: 401 })
  }

  try {
    const { feature, tasks, result, startDate, databaseId, priority, dependencies, risks } = await request.json()

    if (!databaseId) {
      return NextResponse.json({ error: 'No database ID provided' }, { status: 400 })
    }

    const notion = new Client({ auth: notionToken })

    // Extraire la date de livraison et le total des jours
    const deliveryDate = result.match(/Livraison estimée\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1]
    const totalDays = result.match(/total de (\d+) jours?/i)?.[1]

    // Ajout de la priorité dans les propriétés
    const properties: any = {
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
    };
    if (priority) {
      properties['Priorité'] = {
        rich_text: [{ text: { content: priority } }]
      };
    }

    // Construction des children (blocs)
    const children = [
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
    ];
    // Ajout des dépendances techniques si présentes
    if (dependencies && Array.isArray(dependencies) && dependencies.length > 0) {
      children.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: 'Dépendances techniques' } }]
        }
      });
      children.push(...dependencies.map((dep: string) => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: dep } }]
        }
      })));
    }
    // Ajout des risques identifiés si présents
    if (risks && typeof risks === 'string' && risks.trim().length > 0) {
      children.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: 'Risques identifiés' } }]
        }
      });
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: risks } }]
        }
      });
    }
    // Ajout du résumé
    children.push(
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
    );

    // Créer la page dans Notion
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      children
    })

    return NextResponse.json({ success: true, pageId: response.id })
  } catch (error) {
    console.error('Notion export error:', error)
    return NextResponse.json({ error: 'Failed to export to Notion' }, { status: 500 })
  }
} 