import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { feature, capacity = 1 } = body

    const prompt = `
Tu es un assistant produit.
Voici une description de fonctionnalité : "${feature}"

Ta mission :
1. Découpe-la en 3 à 7 tâches techniques
2. Estime pour chaque tâche une durée (en jours)
3. Indique un niveau de confiance (faible, moyen, élevé)
4. Calcule ensuite le temps total estimé (en jours)

Enfin :
5. Si l'équipe est composée de ${capacity} développeur(s) à 80% de capacité disponible,
   calcule une **date de livraison réaliste**, à partir d'aujourd'hui (${new Date().toLocaleDateString('fr-FR')})
   - Affiche la date de livraison au format "Livraison estimée : jj/mm/aaaa" sur une ligne séparée

6. Ajoute une section "Calculs secondaires" (à afficher uniquement si l'utilisateur le souhaite) comprenant :
   - L'effort total en homme-jours
   - Une marge de sécurité (en % et en jours)
   - Toute autre information utile pour un chef de projet

Présente ta réponse en :
- Un tableau clair
- Un résumé avec : durée totale estimée + date de livraison
- Une section "Calculs secondaires" bien séparée

Sois synthétique mais structuré.
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
