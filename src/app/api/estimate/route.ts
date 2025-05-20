import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { feature, integrationLevel = '', dataConcern = '', startDate = '', githubVelocity, team = [], totalCapacity, priority, dependencies, velocitySource, velocityData, teamCapacity, teamAbsences, excludeWeekends, realCapacity, estimationPeriod, risks, sector, stack, clientType, constraints } = body

    // Détermine la date de départ à utiliser dans le prompt
    const startDatePrompt = startDate
      ? `Date de démarrage : ${new Date(startDate).toLocaleDateString('fr-FR')}`
      : `Date de démarrage : aujourd'hui (${new Date().toLocaleDateString('fr-FR')})`

    let velocityPrompt = '';
    if (velocityData && velocityData.summary) {
      if (velocitySource === 'github') {
        velocityPrompt = `\nVélocité historique de l'équipe (tickets GitHub) :\n- ${velocityData.summary}\nMerci d'en tenir compte pour ajuster l'estimation.`;
      } else if (velocitySource === 'trello') {
        velocityPrompt = `\nVélocité historique de l'équipe (cartes Trello) :\n- ${velocityData.summary}\nMerci d'en tenir compte pour ajuster l'estimation.`;
      } else if (velocitySource === 'jira') {
        velocityPrompt = `\nVélocité historique de l'équipe (tickets JIRA) :\n- ${velocityData.summary}\nMerci d'en tenir compte pour ajuster l'estimation.`;
      } else if (velocitySource === 'notion') {
        velocityPrompt = `\nVélocité historique de l'équipe (tickets Notion) :\n- ${velocityData.summary}\nMerci d'en tenir compte pour ajuster l'estimation.`;
      }
    } else if (githubVelocity && githubVelocity.avgPerWeek && githubVelocity.avgDuration) {
      velocityPrompt = `\nVélocité historique de l'équipe (tickets GitHub) :\n- ${githubVelocity.avgPerWeek.toFixed(1)} tickets fermés/semaine\n- Durée moyenne de résolution : ${githubVelocity.avgDuration.toFixed(1)} jours/ticket\nMerci d'en tenir compte pour ajuster l'estimation.`;
    }

    let teamPrompt = '';
    if (Array.isArray(team) && team.length > 0) {
      teamPrompt = `\nComposition de l'équipe et capacité réelle :\n`;
      team.forEach((m: { name?: string; percent?: number; comment?: string }, idx: number) => {
        teamPrompt += `- ${m.name ? m.name : 'Membre ' + (idx + 1)} : ${m.percent || 0}% du temps. ${m.comment ? 'Commentaires : ' + m.comment : ''}\n`;
      });
      if (totalCapacity !== undefined) {
        teamPrompt += `\nCapacité totale de l'équipe : ${totalCapacity}% (somme des % temps de chaque membre). Merci d'en tenir compte pour ajuster la date de livraison.`;
      }
    }

    const priorityPrompt = priority ? `La priorité de la fonctionnalité est : ${priority}.` : "";
    console.log(priorityPrompt);

    // Dépendances et risques
    let dependenciesPrompt = '';
    if (Array.isArray(dependencies) && dependencies.length > 0) {
      const crit = dependencies.filter((d: { name: string; level: string }) => d.level === 'critique');
      const mod = dependencies.filter((d: { name: string; level: string }) => d.level === 'modérée');
      const min = dependencies.filter((d: { name: string; level: string }) => d.level === 'mineure');
      dependenciesPrompt = `\nDépendances techniques à prendre en compte :\n`;
      if (crit.length > 0) dependenciesPrompt += `- Critiques : ${crit.map((d: { name: string }) => d.name).join(', ')}\n`;
      if (mod.length > 0) dependenciesPrompt += `- Modérées : ${mod.map((d: { name: string }) => d.name).join(', ')}\n`;
      if (min.length > 0) dependenciesPrompt += `- Mineures : ${min.map((d: { name: string }) => d.name).join(', ')}\n`;
      dependenciesPrompt += `Merci d'ajouter un buffer de sécurité pour les dépendances critiques et de pondérer l'estimation selon le niveau de risque.`;
    }
    let risksPrompt = '';
    if (typeof risks === 'string' && risks.trim().length > 0) {
      risksPrompt = `\nRisques identifiés : ${risks.trim()}\nMerci d'en tenir compte pour ajuster la confiance et la date de livraison.`;
    }

    const sectorPrompt = `\nSecteur d'activité : ${sector || 'Non précisé'}`;
    const stackPrompt = `\nStack technique : ${stack || 'Non précisé'}`;
    const clientTypePrompt = `\nType de client : ${clientType || 'Non précisé'}`;
    const constraintsPrompt = `\nContraintes spécifiques : ${constraints || 'Aucune'}`;

    // Lecture des feedbacks et calcul de l'écart moyen
    let feedbackPhrase = '';
    let correctionPct = 0;
    let tendance = '';
    try {
      const FEEDBACK_PATH = path.join(process.cwd(), 'feedbacks.json');
      const content = await fs.readFile(FEEDBACK_PATH, 'utf-8');
      const feedbacks = JSON.parse(content);
      if (Array.isArray(feedbacks) && feedbacks.length >= 2) {
        const last = feedbacks.slice(-5); // 5 derniers
        let sumPct = 0;
        let count = 0;
        last.forEach((f: { estimation: number; realDuration: number }) => {
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
          tendance = avgPct > 0 ? 'trop optimiste' : 'trop pessimiste';
          // Correction automatique si écart > 10%
          if (Math.abs(avgPct) > 10) {
            correctionPct = avgPct;
            feedbackPhrase = `\nSur les ${count} dernières fonctionnalités, l'estimation était en moyenne ${absPct}% ${tendance}. Un correctif automatique de ${correctionPct > 0 ? '+' : ''}${correctionPct.toFixed(1)}% sera appliqué à l'estimation. Merci d'en tenir compte.`;
          } else {
            feedbackPhrase = `\nSur les ${count} dernières fonctionnalités, l'estimation était en moyenne ${absPct}% ${tendance}.`;
          }
        }
      }
    } catch {}

    // Bloc capacité équipe avancée
    let capacityPrompt = '';
    if (typeof realCapacity === 'number' && typeof teamCapacity === 'number') {
      capacityPrompt = `\nCapacité équipe déclarée :\n- Capacité totale : ${teamCapacity}%\n- Absences/congés : ${teamAbsences || 0} jours\n- Exclure week-ends : ${excludeWeekends ? 'oui' : 'non'}\n- Capacité réelle calculée : ${realCapacity} jours-homme sur ${estimationPeriod} jours\nMerci d'en tenir compte pour ajuster la date de livraison.`;
    }

    const prompt = `
Tu es un assistant produit.

Voici la fonctionnalité décrite : "${feature}"
${capacityPrompt}
Niveau d'intégration SI : ${integrationLevel}
Problématique de données : ${dataConcern}
${startDatePrompt}
${velocityPrompt}
${teamPrompt}
${priorityPrompt}
${dependenciesPrompt}${risksPrompt}${sectorPrompt}${stackPrompt}${clientTypePrompt}${constraintsPrompt}
${feedbackPhrase}

IMPORTANT :
- Adapte le découpage des tâches, la marge de sécurité, la gestion des risques et la pédagogie de l'estimation en fonction du secteur d'activité, de la stack technique, du type de client et des contraintes spécifiques indiquées ci-dessus.
- Si le secteur implique des exigences particulières (sécurité, conformité, accessibilité, etc.), ajoute un buffer adapté et explique-le.
- Si le type de client est "Grand groupe", prévois une marge supplémentaire pour la coordination et la validation.

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
    let confidenceScore = 80;
    const scoreDetails: Record<string, string> = {};
    // 1. Dispersion des durées
    if (durations.length > 1) {
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const ratio = min / max;
      if (ratio > 0.5) {
        confidenceScore += 10;
        scoreDetails.durations = 'Tâches équilibrées (+10)';
      } else {
        confidenceScore -= 10;
        scoreDetails.durations = 'Forte dispersion des durées (-10)';
      }
    } else if (durations.length === 1) {
      confidenceScore -= 10;
      scoreDetails.durations = 'Une seule tâche (-10)';
    } else {
      confidenceScore -= 20;
      scoreDetails.durations = 'Aucune tâche détectée (-20)';
    }
    // 2. Dépendances critiques
    if (Array.isArray(dependencies) && dependencies.some((d: { name: string; level: string }) => d.level === 'critique')) {
      confidenceScore -= 15;
      scoreDetails.dependencies = 'Dépendances critiques présentes (-15)';
    } else if (Array.isArray(dependencies) && dependencies.length > 0) {
      confidenceScore -= 5;
      scoreDetails.dependencies = 'Dépendances non critiques (-5)';
    } else {
      scoreDetails.dependencies = 'Aucune dépendance (0)';
    }
    // 3. Risques identifiés
    if (typeof risks === 'string' && risks.trim().length > 0) {
      confidenceScore -= 10;
      scoreDetails.risks = 'Risques identifiés (-10)';
    } else {
      scoreDetails.risks = 'Aucun risque identifié (0)';
    }
    // 4. Vélocité faible
    if (velocityData && velocityData.summary) {
      const match = velocityData.summary.match(/([\d\.]+)\s*(tickets|cartes)\/semaine/);
      if (match && parseFloat(match[1]) < 1) {
        confidenceScore -= 10;
        scoreDetails.velocity = 'Vélocité faible (<1/semaine) (-10)';
      } else {
        scoreDetails.velocity = 'Vélocité correcte (0)';
      }
    }
    // 5. Historique d'écarts importants
    if (typeof correctionPct === 'number' && Math.abs(correctionPct) > 20) {
      confidenceScore -= 10;
      scoreDetails.history = 'Historique d\'écarts importants (-10)';
    } else {
      scoreDetails.history = 'Historique stable (0)';
    }
    // Clamp
    confidenceScore = Math.max(10, Math.min(100, confidenceScore));

    // Extraction robuste des tâches (exemple, à adapter selon ton parsing)
    const tasks = [];
    const lines = output.split(/\n|\r/);
    for (const l of lines) {
      const match = l.match(/^\s*(?:\d+\.|-)\s*([^:]+):\s*(\d+)\s*jours?/i);
      if (match) {
        tasks.push({
          name: match[1].trim(),
          days: parseInt(match[2], 10),
          tool: "" // ou extraire l'outil si tu le veux
        });
      }
    }
    const totalDays = tasks.reduce((sum, t) => sum + (t.days || 0), 0);

    // Extraction de la date de livraison estimée
    const dateMatch = output.match(/date de livraison estimée\s*[:\-–]?\s*([\w\d\/\-]+)/i);
    const deliveryDate = dateMatch ? dateMatch[1] : "";

    // Correction IA (exemple)
    const aiCorrection = correctionPct ? `${correctionPct > 0 ? "+" : ""}${correctionPct.toFixed(1)}% pour marge historique` : "";

    // Conclusion IA (texte brut)
    const aiText = output;

    // Score details (déjà calculé plus haut)
    const scoreDetailsArr = Object.entries(scoreDetails).map(([label, value]) => ({ label, value }));

    return NextResponse.json({
      tasks,
      totalDays,
      buffer: 2, // ou calculé selon dépendances
      deliveryDate,
      confidenceScore,
      scoreDetails: scoreDetailsArr,
      aiCorrection,
      aiText
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
