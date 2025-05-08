import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { feature, capacity = 1, integrationLevel = '', dataConcern = '', startDate = '', githubVelocity, team = [], totalCapacity } = body

    // Détermine la date de départ à utiliser dans le prompt
    const startDatePrompt = startDate
      ? `Date de démarrage : ${new Date(startDate).toLocaleDateString('fr-FR')}`
      : `Date de démarrage : aujourd'hui (${new Date().toLocaleDateString('fr-FR')})`

    let velocityPrompt = '';
    if (githubVelocity && githubVelocity.avgPerWeek && githubVelocity.avgDuration) {
      velocityPrompt = `\nVélocité historique de l'équipe (tickets GitHub) :\n- ${githubVelocity.avgPerWeek.toFixed(1)} tickets fermés/semaine\n- Durée moyenne de résolution : ${githubVelocity.avgDuration.toFixed(1)} jours/ticket\nMerci d'en tenir compte pour ajuster l'estimation.`;
    }

    let teamPrompt = '';
    if (Array.isArray(team) && team.length > 0) {
      teamPrompt = `\nComposition de l'équipe et capacité réelle :\n`;
      team.forEach((m: any, idx: number) => {
        teamPrompt += `- ${m.name ? m.name : 'Membre ' + (idx + 1)} : ${m.percent || 0}% du temps. ${m.comment ? 'Commentaires : ' + m.comment : ''}\n`;
      });
      if (totalCapacity !== undefined) {
        teamPrompt += `\nCapacité totale de l'équipe : ${totalCapacity}% (somme des % temps de chaque membre). Merci d'en tenir compte pour ajuster la date de livraison.`;
      }
    }

    const prompt = `
Tu es un assistant produit.

Voici la fonctionnalité décrite : "${feature}"
Capacité équipe : ${capacity} développeur(s)
Niveau d'intégration SI : ${integrationLevel}
Problématique de données : ${dataConcern}
${startDatePrompt}
${velocityPrompt}
${teamPrompt}

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
          { role: 'system', content: "Tu es product manager et tu estime les délais de livraison des fonctionnalités." },
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
