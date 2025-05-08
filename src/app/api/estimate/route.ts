import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { feature, capacity = 1, integrationLevel = '', dataConcern = '', startDate = '' } = body

    // Détermine la date de départ à utiliser dans le prompt
    const startDatePrompt = startDate
      ? `Date de démarrage : ${new Date(startDate).toLocaleDateString('fr-FR')}`
      : `Date de démarrage : aujourd'hui (${new Date().toLocaleDateString('fr-FR')})`

    const prompt = `
Tu es un assistant produit.

Voici la fonctionnalité décrite : "${feature}"
Capacité équipe : ${capacity} développeur(s)
Niveau d'intégration SI : ${integrationLevel}
Problématique de données : ${dataConcern}
${startDatePrompt}

Découpe la fonctionnalité en tâches techniques avec estimation.
Puis calcule une date de livraison réaliste en tenant compte des contraintes ci-dessus.
`

    // Appel à l'API OpenAI (exemple, à adapter avec ta clé et endpoint)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: "Tu es un assistant en estimation produit." },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
    })

    const data = await openaiRes.json()
    const output = data.choices?.[0]?.message?.content || "Erreur dans la réponse."

    return NextResponse.json({ output })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
