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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col gap-2 px-6 pt-8 pb-4 max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-extrabold text-blue-900 flex items-center gap-2 tracking-tight mx-auto">
          <span role="img" aria-label="bulb">💡</span> Estimation par IA
        </h1>
      </div>
      <div className="grid grid-cols-4 gap-4 px-6 py-8 max-w-[1600px] mx-auto">
        {/* Colonne 1 : Saisie & Découpage */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-base font-bold text-blue-900 mb-2">Saisie & contexte</div>
            <label className="block font-semibold text-gray-800 mb-1 text-sm">Décrire la fonctionnalité</label>
            <textarea className="rounded border px-2 py-1 w-full text-sm text-gray-800 bg-white mb-2" rows={3} value={feature} onChange={e => setFeature(e.target.value)} placeholder="Ex : Authentification Google, dashboard, etc." required />
            <label className="block font-semibold text-gray-800 mb-1 text-sm">Date de démarrage</label>
            <input type="date" className="rounded border px-2 py-1 w-full text-sm text-gray-800 bg-white mb-2" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            <button className="w-full bg-blue-600 text-white font-bold rounded py-2 text-sm mt-2" disabled={isAnalyzing || !feature || !startDate} onClick={handleAnalyze}>
              {isAnalyzing ? "Analyse en cours..." : "Analyser avec l'IA"}
            </button>
            {errorMsg && <div className="mt-2 text-red-600 text-xs">{errorMsg}</div>}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-base font-bold text-blue-900 mb-2">Découpage proposé</div>
            <ul className="mb-2">
              {manualTasks.map((t, i) => (
                <li key={i} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 mb-1 text-sm">
                  <span className="truncate">{t}</span>
                  {!isDecoupageValidated && (
                    <button className="text-red-500 ml-2 text-xs" onClick={() => handleRemoveTask(i)} title="Supprimer">✖</button>
                  )}
                </li>
              ))}
            </ul>
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
        {/* Colonne 2 : Analyse IA & Estimation */}
        <div className="flex flex-col gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="text-base font-bold text-blue-900 mb-2">Analyse IA</div>
            <div className="text-xs text-gray-700 mb-2">Pour estimer les délais de livraison, la fonctionnalité est découpée en tâches techniques. Lance l'analyse IA pour obtenir l'estimation.</div>
            <div className="text-base font-bold text-blue-900 mb-2">Tâches techniques</div>
            <table className="w-full text-xs text-gray-800 mb-2">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 font-semibold">Tâches</th>
                  <th className="text-left py-1 font-semibold">Estimation</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={2} className="text-center text-gray-400 italic py-2">Veuillez lancer l'analyse IA.</td></tr>
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
            <div className="mt-1 font-bold text-right text-blue-900 text-sm">
              Total estimé : {totalDays + buffer} jours {buffer > 0 && <span className="text-xs text-orange-500">(buffer inclus)</span>}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="text-base font-bold text-green-900 mb-2">Livraison estimée</div>
            <div className="text-lg font-bold text-green-700">{deliveryDate || <span className="text-gray-400 italic">-</span>}</div>
            <div className="mt-2 flex items-center gap-2">
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
        {/* Colonne 3 : Conclusion */}
        <div className="flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-full flex flex-col">
            <div className="text-base font-bold text-blue-900 mb-2">Conclusion</div>
            <div className="text-sm text-gray-800 mb-2 flex-1">
              {aiText ? (
                <div>{aiText}</div>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>
              )}
              {aiCorrection && <div className="text-xs text-orange-600 mt-1">{aiCorrection}</div>}
            </div>
            <button className="w-full bg-green-600 text-white font-bold rounded py-2 text-sm mt-3" disabled={aiText === ""}>Exporter la conclusion en PDF</button>
          </div>
        </div>
        {/* Colonne 4 : Feedback & Exports */}
        <div className="flex flex-col gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <div className="text-base font-bold text-yellow-700 mb-2">Feedback & historique</div>
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
            <div className="text-base font-bold text-gray-700 mb-2">Exports</div>
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
