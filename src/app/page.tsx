"use client";

import { useState } from "react";
import Link from "next/link";

type Task = { name: string; days: number; tool: string };
type ScoreDetail = { label: string; value: number };

function ExportCenter({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex gap-3 flex-wrap">
      <button className="btn" disabled={!enabled}>Exporter Notion</button>
      <button className="btn" disabled={!enabled}>Exporter PDF</button>
      <button className="btn" disabled={!enabled}>Exporter CSV</button>
      <button className="btn" disabled={!enabled}>Exporter Trello</button>
      <button className="btn" disabled={!enabled}>Exporter JIRA</button>
    </div>
  );
}

export default function EstimationLegacy() {
  // Saisie & contexte
  const [feature, setFeature] = useState("");
  const [startDate, setStartDate] = useState("");
  const [teamCapacity, setTeamCapacity] = useState(100);
  const [teamAbsences, setTeamAbsences] = useState(0);
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [velocitySource, setVelocitySource] = useState("github");
  const [dependencies, setDependencies] = useState<string>("");
  const [risks, setRisks] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sector, setSector] = useState("");
  const [stack, setStack] = useState("");
  const [clientType, setClientType] = useState("");
  const [constraints, setConstraints] = useState("");

  // Découpage & estimation (initialisé à vide)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [buffer, setBuffer] = useState(0);

  // Livraison & scoring (initialisé à vide)
  const [deliveryDate, setDeliveryDate] = useState("");
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [scoreDetails, setScoreDetails] = useState<ScoreDetail[]>([]);
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Résultat / conclusion (initialisé à vide)
  const [aiCorrection, setAiCorrection] = useState("");
  const [aiText, setAiText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Feedback & historique
  const [nps, setNps] = useState("");
  const [npsComment, setNpsComment] = useState("");
  const [npsHistory, setNpsHistory] = useState<{ nps: string; comment: string; date: string }[]>([]);
  const handleSendNps = () => {
    if (!nps) return;
    setNpsHistory([{ nps, comment: npsComment, date: new Date().toLocaleString() }, ...npsHistory]);
    setNps("");
    setNpsComment("");
  };

  // Exports (mock)
  const exportReady = true;

  // Handler analyse IA (appelle l'API et remplit dynamiquement les données)
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          startDate,
          teamCapacity,
          teamAbsences,
          excludeWeekends,
          velocitySource,
          dependencies,
          risks,
          sector,
          stack,
          clientType,
          constraints,
        }),
      });
      if (!res.ok) throw new Error("Erreur API");
      const data = await res.json();
      setTasks(data.tasks || []);
      setTotalDays(data.totalDays || 0);
      setBuffer(data.buffer || 0);
      setDeliveryDate(data.deliveryDate || "");
      setConfidenceScore(data.confidenceScore || null);
      setScoreDetails(data.scoreDetails || []);
      setAiCorrection(data.aiCorrection || "");
      setAiText(data.aiText || "");
    } catch {
      setErrorMsg("Erreur lors de l'analyse IA. Veuillez réessayer.");
      setTasks([]);
      setTotalDays(0);
      setDeliveryDate("");
      setConfidenceScore(null);
      setScoreDetails([]);
      setAiCorrection("");
      setAiText("");
    }
    setIsAnalyzing(false);
  };

  // Fonction utilitaire pour le total avec buffer
  function getTotalWithBuffer() {
    return totalDays + buffer;
  }

  // Liste des jours fériés français (métropole, année courante)
  function getFrenchHolidays(year: number): Date[] {
    // Jours fixes
    const holidays = [
      new Date(year, 0, 1),   // Jour de l'an
      new Date(year, 4, 1),   // Fête du Travail
      new Date(year, 4, 8),   // Victoire 1945
      new Date(year, 6, 14),  // Fête nationale
      new Date(year, 7, 15),  // Assomption
      new Date(year, 10, 1),  // Toussaint
      new Date(year, 10, 11), // Armistice
      new Date(year, 11, 25), // Noël
    ];
    // Jours mobiles (Pâques, Ascension, Pentecôte)
    // Calcul de Pâques (algorithme de Meeus/Jones/Butcher)
    const f = Math.floor,
      G = year % 19,
      C = f(year / 100),
      H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
      I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
      J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
      L = I - J,
      month = 3 + f((L + 40) / 44),
      day = L + 28 - 31 * f(month / 4);
    const easter = new Date(year, month - 1, day);
    holidays.push(
      new Date(easter), // Pâques
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1), // Lundi de Pâques
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 39), // Ascension
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 49), // Pentecôte
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 50), // Lundi de Pentecôte
    );
    return holidays;
  }

  // Calcule la date de livraison estimée (exclut week-ends et jours fériés)
  function computeDeliveryDate(start: string, days: number, excludeWeekends: boolean = true): string {
    if (!start || days <= 0) return '';
    let date = new Date(start);
    let added = 0;
    const holidays = getFrenchHolidays(date.getFullYear());
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = holidays.some(h => h.getDate() === date.getDate() && h.getMonth() === date.getMonth());
      if ((excludeWeekends && isWeekend) || isHoliday) continue;
      added++;
    }
    return date.toLocaleDateString('fr-FR');
  }

  // Génère la conclusion synthétique pour la section 4 (modèle strict docs/ui-reference.md)
  function getConclusionSynth() {
    if (!feature || !totalDays) return '';
    const totalWithBuffer = getTotalWithBuffer();
    const bufferPct = totalDays > 0 ? Math.round(buffer / totalDays * 100) : 0;
    // Format date JJ/MM/AAAA
    function formatDateFR(dateStr: string) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR');
    }
    let txt = `Le développement de la fonctionnalité est estimé à ${totalWithBuffer} jours ouvrés`;
    if (buffer > 0) txt += ` (incluant un buffer de sécurité de ${bufferPct}%)`;
    txt += ".";
    const dateToShow = deliveryDate && deliveryDate !== '-' ? deliveryDate : computeDeliveryDate(startDate, getTotalWithBuffer(), excludeWeekends);
    if (dateToShow) {
      txt += `\nLa date de livraison réaliste serait autour du ${formatDateFR(dateToShow)}.`;
    }
    // Ajout du message conditionnel sur la marge de sécurité
    if (buffer > 0) {
      if (sector && constraints) {
        txt += `\nLa marge de sécurité a été ajustée en fonction du secteur d'activité (« ${sector} ») et des contraintes spécifiques (« ${constraints} »).`;
      } else if (sector) {
        txt += `\nLa marge de sécurité a été ajustée en fonction du secteur d'activité (« ${sector} »).`;
      } else if (constraints) {
        txt += `\nLa marge de sécurité a été ajustée en fonction des contraintes spécifiques (« ${constraints} »).`;
      }
      // Ajout de la phrase d'impact
      if (sector || constraints) {
        txt += `\nCela a entraîné l'ajout d'un buffer de sécurité de +${buffer} jours, soit ${bufferPct}% du total, pour tenir compte de ces spécificités.`;
      }
    }
    txt += "\nCette estimation prend en compte la capacité de l'équipe, les absences, les dépendances et les risques déclarés.";
    return txt;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 px-1 py-4 font-sans">
      <div className="flex flex-col gap-1 mb-4">
        <Link href="/" className="text-blue-600 underline w-fit text-[14px]">← Page précédente</Link>
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2 tracking-tight">
          <span role="img" aria-label="bulb">💡</span> Estimation par IA (Version Legacy)
        </h1>
        <div className="text-[13px] text-gray-500 mt-1 mb-2">
          Pour garantir la confidentialité de vos informations, une anonymisation contextuelle forte par IA est automatiquement réalisée.
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
        {/* Colonne 1 : Saisie & contexte */}
        <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-4 flex flex-col gap-3 min-w-[220px] max-w-[340px] text-[14px] font-medium text-[#222]">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">1</span>
            <span className="text-lg font-bold text-blue-900">Saisie & contexte</span>
          </div>
          <label className="block font-semibold text-[#222] mb-1">Description de la fonctionnalité *</label>
          <textarea className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" rows={2} value={feature} onChange={e => setFeature(e.target.value)} placeholder="Ex : Authentification Google, dashboard, etc." required />
          <label className="block font-semibold text-[#222] mb-1">Date de démarrage *</label>
          <input type="date" className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          <div className="flex flex-wrap gap-2 mb-1">
            <div className="flex-1 min-w-[90px]">
              <label className="block font-semibold text-[#222] mb-1">Capacité équipe (%)</label>
              <input type="number" min={0} max={100} className="rounded border px-2 py-1.5 w-full text-[#222] bg-white text-[14px]" value={teamCapacity} onChange={e => setTeamCapacity(Number(e.target.value))} />
            </div>
            <div className="flex-1 min-w-[90px]">
              <label className="block font-semibold text-[#222] mb-1">Jours d&apos;absence</label>
              <input type="number" min={0} className="rounded border px-2 py-1.5 w-full text-[#222] bg-white text-[14px]" value={teamAbsences} onChange={e => setTeamAbsences(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <input type="checkbox" checked={excludeWeekends} onChange={e => setExcludeWeekends(e.target.checked)} id="weekends" />
            <label htmlFor="weekends" className="text-[#222]">Exclure les week-ends</label>
          </div>
          <label className="block font-semibold text-[#222] mb-1">Source de vélocité</label>
          <select className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" value={velocitySource} onChange={e => setVelocitySource(e.target.value)}>
            <option value="github">GitHub</option>
            <option value="trello">Trello</option>
          </select>
          <div className="flex flex-wrap gap-2 mb-1">
            <div className="flex-1 min-w-[120px]">
              <label className="block font-semibold text-[#222] mb-1">Dépendances</label>
              <input className="rounded border px-2 py-1.5 w-full text-[#222] bg-white text-[14px]" value={dependencies} onChange={e => setDependencies(e.target.value)} placeholder="Ex : API externe, équipe data, etc." />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block font-semibold text-[#222] mb-1">Risques</label>
              <input className="rounded border px-2 py-1.5 w-full text-[#222] bg-white text-[14px]" value={risks} onChange={e => setRisks(e.target.value)} placeholder="Ex : instabilité API, dette technique, etc." />
            </div>
          </div>
          <label className="block font-semibold text-[#222] mb-1">Secteur d'activité</label>
          <input className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" value={sector} onChange={e => setSector(e.target.value)} placeholder="Ex : Santé, Finance, Éducation..." />
          <label className="block font-semibold text-[#222] mb-1">Stack technique</label>
          <input className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" value={stack} onChange={e => setStack(e.target.value)} placeholder="Ex : React, Node.js, AWS..." />
          <label className="block font-semibold text-[#222] mb-1">Type de client</label>
          <select className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" value={clientType} onChange={e => setClientType(e.target.value)}>
            <option value="">Sélectionner</option>
            <option value="Startup">Startup</option>
            <option value="PME">PME</option>
            <option value="Grand groupe">Grand groupe</option>
            <option value="Autre">Autre</option>
          </select>
          <label className="block font-semibold text-[#222] mb-1">Contraintes spécifiques</label>
          <input className="rounded border px-2 py-1.5 w-full text-[#222] bg-white mb-1 text-[14px]" value={constraints} onChange={e => setConstraints(e.target.value)} placeholder="Ex : RGPD, sécurité, accessibilité..." />
          <button className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded shadow-sm disabled:opacity-50 font-bold text-[14px]" disabled={isAnalyzing || !feature || !startDate} onClick={handleAnalyze}>
            {isAnalyzing ? "Analyse en cours..." : "Analyser avec l'IA"}
          </button>
          {errorMsg && <div className="mt-1 text-red-600 text-xs">{errorMsg}</div>}
        </div>
        {/* Colonne 2 : Analyse IA & Tâches techniques */}
        <div className="flex flex-col gap-3 min-w-[220px] max-w-[340px] text-[14px] font-medium text-[#222]">
          <div className="bg-blue-50 rounded-lg border border-blue-100 shadow-none p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">2</span>
              <span className="text-lg font-bold text-blue-900">Analyse IA</span>
            </div>
            <div className="text-[#444] text-[13px] mb-1">
              Pour estimer les délais de livraison de la fonctionnalité &apos;{feature || '...' }&apos;, nous devons d&apos;abord découper cette fonctionnalité en plusieurs tâches techniques. Voici une décomposition possible :
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-100 shadow-none p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">3</span>
              <span className="text-lg font-bold text-blue-900">Tâches techniques</span>
            </div>
            <table className="min-w-full text-[13px] text-[#222]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 font-semibold">Tâches</th>
                  <th className="text-left py-1 font-semibold">Estimation</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={2} className="text-center text-gray-400 italic">Veuillez lancer l&apos;analyse IA.</td></tr>
                ) : (
                  tasks.map((t, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1">{t.name}</td>
                      <td className="py-1">{t.days} jours</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-2 text-right text-blue-900 text-[14px]">
              <div> Total brut : <span className="font-bold">{totalDays}</span> jours</div>
              {buffer > 0 && (
                <div> Buffer de sécurité ({totalDays > 0 ? Math.round(buffer / totalDays * 100) : 0}%): <span className="font-bold text-orange-600">+{buffer}</span> jours</div>
              )}
              <div className="font-extrabold text-2xl mt-2 text-blue-800">
                Total estimé avec buffer : <span className="text-green-600">{getTotalWithBuffer()}</span> jours
              </div>
            </div>
          </div>
        </div>
        {/* Colonne 3 : Conclusion & Livraison estimée */}
        <div className="flex flex-col gap-3 min-w-[220px] max-w-[340px] text-[14px] font-medium text-[#222]">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">4</span>
              <span className="text-lg font-bold text-blue-900">Conclusion</span>
            </div>
            <div className="text-[#444] text-[13px] mb-1">
              {totalDays > 0 ? (
                <pre className="whitespace-pre-wrap text-[13px] text-blue-900 font-medium">{getConclusionSynth()}</pre>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l&apos;analyse IA.</span>
              )}
            </div>
            <button className="mt-1 px-3 py-1.5 bg-green-600 text-white rounded shadow-sm font-bold text-[14px]" disabled={aiText === ""}>Exporter la conclusion en PDF</button>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-100 shadow-none p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">5</span>
              <span className="text-lg font-bold text-blue-900">Livraison estimée</span>
            </div>
            <div className="text-[#222] text-[15px] font-bold mb-1">
              {getTotalWithBuffer() > 0 && startDate ? (
                <span>Livraison estimée : <span className="text-green-600">{deliveryDate}</span></span>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l&apos;analyse IA.</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[13px]">
              <span className="font-semibold">Score de confiance IA :</span>
              {confidenceScore !== null ? (
                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">{confidenceScore}%</span>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l&apos;analyse IA.</span>
              )}
              <button className="text-xs underline text-blue-600" onClick={() => setShowScoreDetails(v => !v)} disabled={scoreDetails.length === 0}>
                {showScoreDetails ? "Masquer les détails" : "Détails"}
              </button>
            </div>
            {showScoreDetails && scoreDetails.length > 0 && (
              <ul className="ml-4 list-disc text-xs">
                {scoreDetails.map((f, i) => (
                  <li key={i}>{f.label} <span className="ml-2 font-mono">{f.value > 0 ? "+" : ""}{f.value}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Colonne 4 : Feedback & Exports */}
        <div className="flex flex-col gap-3 min-w-[220px] max-w-[340px] text-[14px] font-medium text-[#222]">
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 shadow-none p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">6</span>
              <span className="text-lg font-bold text-yellow-700">Feedback & historique</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="font-semibold text-[#222]">Votre note (NPS) :</label>
                <input type="number" min={0} max={10} className="rounded border px-2 py-1.5 w-12 text-[#222] bg-white text-[14px]" value={nps} onChange={e => setNps(e.target.value)} />
                <input type="text" className="rounded border px-2 py-1.5 flex-1 text-[#222] bg-white text-[14px]" placeholder="Un commentaire ?" value={npsComment} onChange={e => setNpsComment(e.target.value)} />
                <button className="px-2 py-1.5 bg-orange-500 text-white rounded font-bold text-[14px]" onClick={handleSendNps} disabled={!nps}>Envoyer</button>
              </div>
              {npsHistory.length > 0 && (
                <div className="mt-1">
                  <div className="font-semibold text-xs mb-1 text-[#444]">Historique :</div>
                  <ul className="text-xs space-y-1">
                    {npsHistory.map((h, i) => (
                      <li key={i} className="text-gray-500">{h.nps}/10 - {h.comment} <span className="ml-2 text-gray-400">({h.date})</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-none p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[15px]">7</span>
              <span className="text-lg font-bold text-gray-700">Exports</span>
            </div>
            <ExportCenter enabled={exportReady} />
          </div>
        </div>
      </div>
    </div>
  );
} 
