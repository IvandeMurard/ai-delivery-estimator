import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { feature, capacity = 1, integrationLevel = '', dataConcern = '', startDate = '', githubVelocity, team = [], totalCapacity, priority, dependencies } = body

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

    const priorityPrompt = priority ? `La priorité de la fonctionnalité est : ${priority}.` : "";
    console.log(priorityPrompt);

    const dependenciesPrompt = dependencies?.length
      ? `Les dépendances techniques mentionnées sont : ${dependencies.join(", ")}.`
      : "";

    // Lecture des feedbacks et calcul de l'écart moyen
    let feedbackPhrase = '';
    try {
      const FEEDBACK_PATH = path.join(process.cwd(), 'feedbacks.json');
      const content = await fs.readFile(FEEDBACK_PATH, 'utf-8');
      const feedbacks = JSON.parse(content);
      if (Array.isArray(feedbacks) && feedbacks.length >= 2) {
        const last = feedbacks.slice(-5); // 5 derniers
        let sumPct = 0;
        let count = 0;
        last.forEach((f: any) => {
          const est = Number(f.estimation);
          const real = Number(f.realDuration);
          if (est > 0 && real > 0) {
            sumPct += ((real - est) / est) * 100;
            count++;
          }
        });
        if (count > 0) {
          const avgPct = sumPct / count;
          const absPct = Math.abs(avgPct).toFixed(1);
          const tendance = avgPct > 0 ? 'trop optimiste' : 'trop pessimiste';
          feedbackPhrase = `\nSur les ${count} dernières fonctionnalités, l'estimation était en moyenne ${absPct}% ${tendance}. Merci d'en tenir compte pour ajuster l'estimation.`;
        }
      }
    } catch {}

    const prompt = `
Tu es un assistant produit.

Voici la fonctionnalité décrite : "${feature}"
Capacité équipe : ${capacity} développeur(s)
Niveau d'intégration SI : ${integrationLevel}
Problématique de données : ${dataConcern}
${startDatePrompt}
${velocityPrompt}
${teamPrompt}
${priorityPrompt}
${dependenciesPrompt}
${feedbackPhrase}

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

    // Analyse du texte pour scoring automatique
    // Extraction des tâches et durées (ex: "1. Tâche : 3 jours")
    const taskMatches = output.match(/(?:\d+\.|-)\s*[^:]+:\s*(\d+)\s*jours?/gi) || [];
    const durations = taskMatches.map((m: string) => {
      const d = m.match(/(\d+)\s*jours?/);
      return d ? parseInt(d[1], 10) : null;
    }).filter(Boolean);
    const nbTasks = durations.length;
    let confidenceScore = 70;
    if (nbTasks >= 5) {
      // Score élevé si >5 tâches et durées équilibrées
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const ratio = min / max;
      if (ratio > 0.5) confidenceScore = 95;
      else confidenceScore = 90;
    } else if (nbTasks >= 3) {
      confidenceScore = 80;
    } else if (nbTasks > 0) {
      confidenceScore = 60;
    } else {
      confidenceScore = 50;
    }
    // Ajustement si gros écart de durée
    if (durations.length > 1) {
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      if (max > 2 * min) confidenceScore -= 10;
    }
    confidenceScore = Math.max(30, Math.min(100, confidenceScore));

    return NextResponse.json({ output, confidenceScore })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
