"use client";

import { useState } from "react";
import StepLayout from "../components/StepLayout";
import { FaRegFileAlt, FaRegListAlt, FaRegCalendarAlt, FaRegCheckCircle, FaRegCommentDots, FaRegFolderOpen } from "react-icons/fa";
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
  const [analysisDone, setAnalysisDone] = useState(false);

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

  // 1. Ajout des états pour le découpage manuel et sa validation
  const [manualTasks, setManualTasks] = useState<string[]>([]);
  const [isDecoupageValidated, setIsDecoupageValidated] = useState(false);
  const [newTask, setNewTask] = useState("");

  // 2. Fonction pour ajouter une tâche
  const handleAddTask = () => {
    if (newTask.trim()) {
      setManualTasks([...manualTasks, newTask.trim()]);
      setNewTask("");
    }
  };
  // 3. Fonction pour supprimer une tâche
  const handleRemoveTask = (idx: number) => {
    setManualTasks(manualTasks.filter((_, i) => i !== idx));
  };
  // 4. Fonction pour valider le découpage
  const handleValidateDecoupage = () => {
    setIsDecoupageValidated(true);
  };
  // 5. Fonction pour réinitialiser tous les champs
  const handleReset = () => {
    setFeature("");
    setStartDate("");
    setTeamCapacity(100);
    setTeamAbsences(0);
    setExcludeWeekends(true);
    setVelocitySource("github");
    setDependencies("");
    setRisks("");
    setIsAnalyzing(false);
    setAnalysisDone(false);
    setTasks([]);
    setTotalDays(0);
    setBuffer(0);
    setDeliveryDate("");
    setConfidenceScore(null);
    setScoreDetails([]);
    setShowScoreDetails(false);
    setAiCorrection("");
    setAiText("");
    setErrorMsg("");
    setNps("");
    setNpsComment("");
    setNpsHistory([]);
    setManualTasks([]);
    setIsDecoupageValidated(false);
    setNewTask("");
  };

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
    } catch (e) {
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

  // Ajout : calcul local de la date de livraison estimée si pas d'IA
  function calculerDateLivraison(startDate: string, totalJours: number) {
    if (!startDate || !totalJours) return "-";
    const d = new Date(startDate);
    let joursRestants = totalJours;
    while (joursRestants > 0) {
      d.setDate(d.getDate() + 1);
      // Exclure week-ends
      if (excludeWeekends && (d.getDay() === 0 || d.getDay() === 6)) continue;
      joursRestants--;
    }
    return d.toLocaleDateString();
  }

  // Utilisation du découpage manuel si pas d'IA
  const showManualTasks = isDecoupageValidated && (tasks.length === 0);
  const effectiveTasks = showManualTasks ? manualTasks.map((name) => ({ name, days: 1, tool: '' })) : tasks;
  const effectiveTotalDays = showManualTasks ? manualTasks.length : totalDays + buffer;
  const effectiveDeliveryDate = showManualTasks ? calculerDateLivraison(startDate, manualTasks.length) : deliveryDate;

  // Génération d'une conclusion synthétique sans liste de tâches
  function getConclusion() {
    if (!feature) return '';
    let txt = `Le développement de la fonctionnalité "${feature}" est estimé à un total de ${effectiveTotalDays} jours ouvrables.`;
    if (effectiveDeliveryDate && effectiveDeliveryDate !== '-') {
      txt += `\nLa date de livraison réaliste serait autour du ${effectiveDeliveryDate}.`;
    }
    txt += '\nCette estimation prend en compte la capacité de l\'équipe, les absences, les dépendances et les risques déclarés.';
    txt += '\nPensez à prévoir une marge pour les imprévus.';
    return txt;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col gap-2 px-6 pt-8 pb-4 max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-extrabold text-blue-900 flex items-center gap-2 tracking-tight mx-auto">
          <span role="img" aria-label="bulb">💡</span> Estimation par IA
        </h1>
      </div>
      <div className="grid grid-cols-4 gap-4 px-6 py-8 max-w-[1600px] mx-auto">
        {/* 1. Saisie & contexte */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">1</span>
              <span className="text-base font-bold text-blue-900 ml-2">Saisie & contexte</span>
            </div>
            <label className="block font-semibold text-gray-800 mb-1 text-sm">Décrire la fonctionnalité</label>
            <textarea className="rounded border px-2 py-1 w-full text-sm text-gray-800 bg-white mb-2" rows={3} value={feature} onChange={e => setFeature(e.target.value)} placeholder="Ex : Authentification Google, dashboard, etc." required />
            <label className="block font-semibold text-gray-800 mb-1 text-sm">Date de démarrage</label>
            <input type="date" className="rounded border px-2 py-1 w-full text-sm text-gray-800 bg-white mb-2" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex-1 min-w-[120px]">
                <label className="block font-semibold text-gray-800 mb-1 text-xs">Capacité équipe (%)</label>
                <input type="number" min={0} max={100} className="rounded border px-2 py-1 w-full text-xs text-gray-800 bg-white" value={teamCapacity} onChange={e => setTeamCapacity(Number(e.target.value))} />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block font-semibold text-gray-800 mb-1 text-xs">Jours d'absence</label>
                <input type="number" min={0} className="rounded border px-2 py-1 w-full text-xs text-gray-800 bg-white" value={teamAbsences} onChange={e => setTeamAbsences(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={excludeWeekends} onChange={e => setExcludeWeekends(e.target.checked)} id="weekends" />
              <label htmlFor="weekends" className="text-gray-800 text-xs">Exclure les week-ends</label>
            </div>
            <label className="block font-semibold text-gray-800 mb-1 text-xs">Source de vélocité</label>
            <select className="rounded border px-2 py-1 w-full text-xs text-gray-800 bg-white mb-2" value={velocitySource} onChange={e => setVelocitySource(e.target.value)}>
              <option value="github">GitHub</option>
              <option value="trello">Trello</option>
            </select>
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex-1 min-w-[180px]">
                <label className="block font-semibold text-gray-800 mb-1 text-xs">Dépendances</label>
                <input className="rounded border px-2 py-1 w-full text-xs text-gray-800 bg-white" value={dependencies} onChange={e => setDependencies(e.target.value)} placeholder="Ex : API externe, équipe data, etc." />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block font-semibold text-gray-800 mb-1 text-xs">Risques</label>
                <input className="rounded border px-2 py-1 w-full text-xs text-gray-800 bg-white" value={risks} onChange={e => setRisks(e.target.value)} placeholder="Ex : instabilité API, dette technique, etc." />
              </div>
            </div>
            <button className="w-full bg-blue-600 text-white font-bold rounded py-2 text-sm mt-2" disabled={isAnalyzing || !feature || !startDate} onClick={handleAnalyze}>
              {isAnalyzing ? "Analyse en cours..." : "Analyser avec l'IA"}
            </button>
            {errorMsg && <div className="mt-2 text-red-600 text-xs">{errorMsg}</div>}
          </div>
          {/* 2. Découpage des tâches techniques */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">2</span>
              <span className="text-base font-bold text-blue-900 ml-2">Découpage des tâches techniques</span>
            </div>
            <ol className="mb-2 list-decimal list-inside text-sm">
              {manualTasks.map((t, i) => (
                <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 mb-1">
                  <span className="truncate flex-1">{t}</span>
                  {!isDecoupageValidated && (
                    <button className="text-red-500 ml-2 text-xs" onClick={() => handleRemoveTask(i)} title="Supprimer">✖</button>
                  )}
                </li>
              ))}
            </ol>
            {!isDecoupageValidated && (
              <div className="flex gap-2 mb-2">
                <input className="rounded border px-2 py-1 flex-1 text-sm" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Ajouter une tâche..." onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); }} />
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold" onClick={handleAddTask}>+ Ajouter</button>
              </div>
            )}
            <div className="flex gap-2">
              <button className="bg-blue-700 text-white px-3 py-1 rounded font-semibold text-xs" onClick={handleValidateDecoupage} disabled={isDecoupageValidated || manualTasks.length === 0}>Valider le découpage</button>
              <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300 text-xs font-semibold" onClick={handleReset} type="button">Réinitialiser</button>
            </div>
          </div>
        </div>
        {/* 3. Tâches techniques & Livraison estimée */}
        <div className="flex flex-col gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">3</span>
              <span className="text-base font-bold text-blue-900 ml-2">Tâches techniques</span>
            </div>
            <table className="w-full text-xs text-gray-800 mb-2">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 font-semibold">#</th>
                  <th className="text-left py-1 font-semibold">Tâche</th>
                  <th className="text-left py-1 font-semibold">Estimation</th>
                </tr>
              </thead>
              <tbody>
                {effectiveTasks.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400 italic py-2">Veuillez lancer l'analyse IA ou valider le découpage.</td></tr>
                ) : (
                  effectiveTasks.map((t, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1 font-mono text-gray-500">{i + 1}</td>
                      <td className="py-1">{t.name || t}</td>
                      <td className="py-1">{t.days ? `${t.days} jours` : '1 jour'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-1 font-bold text-right text-blue-900 text-sm">
              Total estimé : <span className="font-extrabold">{effectiveTotalDays}</span> jours {buffer > 0 && <span className="text-xs text-orange-500">(buffer inclus)</span>}
            </div>
          </div>
          {/* 4. Livraison estimée */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <span className="bg-green-600 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">4</span>
              <span className="text-base font-bold text-green-900 ml-2">Livraison estimée</span>
            </div>
            <div className="text-lg font-bold text-green-700 mb-1">{effectiveDeliveryDate || <span className="text-gray-400 italic">-</span>}</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800 text-sm">Score de confiance IA :</span>
              {confidenceScore !== null ? (
                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold text-xs">{confidenceScore}%</span>
              ) : (
                <span className="text-gray-400 italic text-xs">-</span>
              )}
              <button className="text-xs underline text-blue-600 ml-2" onClick={() => setShowScoreDetails(v => !v)} disabled={scoreDetails.length === 0}>
                {showScoreDetails ? "Masquer les détails" : "Détails"}
              </button>
            </div>
            {showScoreDetails && scoreDetails.length > 0 && (
              <ul className="ml-4 list-disc text-xs mt-1">
                {scoreDetails.map((f, i) => (
                  <li key={i}>{f.label} <span className="ml-2 font-mono">{f.value > 0 ? "+" : ""}{f.value}</span></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* 5. Conclusion */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-full flex flex-col">
            <div className="flex items-center mb-2">
              <span className="bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">5</span>
              <span className="text-base font-bold text-blue-900 ml-2">Conclusion</span>
            </div>
            <div className="text-sm text-gray-800 mb-2 flex-1">
              {feature ? (
                <div className="space-y-2">
                  {getConclusion().split('\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>
              )}
              {aiCorrection && <div className="text-xs text-orange-600 mt-1">{aiCorrection}</div>}
            </div>
            <button className="w-full bg-green-600 text-white font-bold rounded py-2 text-sm mt-3" disabled={feature === ""}>Exporter la conclusion en PDF</button>
          </div>
        </div>
        {/* 6. Feedback & Historique + 7. Exports */}
        <div className="flex flex-col gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <span className="bg-yellow-500 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">6</span>
              <span className="text-base font-bold text-yellow-700 ml-2">Feedback & historique</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="font-semibold text-gray-800 text-sm">Votre note (NPS) :</label>
              <input type="number" min={0} max={10} className="w-12 text-center text-sm border rounded" value={nps} onChange={e => setNps(e.target.value)} />
              <input type="text" className="flex-1 text-sm border rounded ml-2" placeholder="Un commentaire ?" value={npsComment} onChange={e => setNpsComment(e.target.value)} />
              <button className="bg-orange-500 text-white font-bold rounded px-3 py-1 text-sm ml-2" onClick={handleSendNps} disabled={!nps}>Envoyer</button>
            </div>
            {npsHistory.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold text-xs mb-1 text-gray-700">Historique :</div>
                <ul className="text-xs space-y-1">
                  {npsHistory.map((h, i) => (
                    <li key={i} className="text-gray-500">{h.nps}/10 - {h.comment} <span className="ml-2 text-gray-400">({h.date})</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <span className="bg-gray-400 text-white w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm">7</span>
              <span className="text-base font-bold text-gray-700 ml-2">Exports</span>
            </div>
            <div className="inline-flex gap-2 flex-wrap">
              <button className="bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs font-semibold hover:bg-gray-300" disabled={!exportReady}>Exporter Notion</button>
              <button className="bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs font-semibold hover:bg-gray-300" disabled={!exportReady}>Exporter PDF</button>
              <button className="bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs font-semibold hover:bg-gray-300" disabled={!exportReady}>Exporter CSV</button>
              <button className="bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs font-semibold hover:bg-gray-300" disabled={!exportReady}>Exporter Trello</button>
              <button className="bg-gray-200 text-gray-700 rounded px-3 py-1 text-xs font-semibold hover:bg-gray-300" disabled={!exportReady}>Exporter JIRA</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
