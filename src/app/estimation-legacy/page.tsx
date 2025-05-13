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
    <div className="w-full min-h-screen bg-gray-50 px-2 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span role="img" aria-label="bulb">💡</span> Estimation par IA (Version Legacy)
        </h1>
        <Link href="/" className="text-blue-600 underline font-medium hover:text-blue-800">Retour à la landing page</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        {/* Colonne 1 : Saisie & contexte */}
        <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-4 min-w-[260px]">
          <StepLayout id="saisie" stepNumber={1} title={<span>Saisie & contexte</span>} icon={<FaRegFileAlt />}> 
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-800 mb-1">Description de la fonctionnalité *</label>
                <textarea
                  className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                  rows={3}
                  value={feature}
                  onChange={e => setFeature(e.target.value)}
                  placeholder="Ex : Authentification Google, dashboard, etc."
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-gray-800 mb-1">Date de démarrage *</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[120px]">
                  <label className="block font-medium text-gray-800 mb-1">Capacité équipe (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                    value={teamCapacity}
                    onChange={e => setTeamCapacity(Number(e.target.value))}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block font-medium text-gray-800 mb-1">Jours d'absence</label>
                  <input
                    type="number"
                    min={0}
                    className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                    value={teamAbsences}
                    onChange={e => setTeamAbsences(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input
                    type="checkbox"
                    checked={excludeWeekends}
                    onChange={e => setExcludeWeekends(e.target.checked)}
                    id="weekends"
                  />
                  <label htmlFor="weekends" className="text-gray-800">Exclure les week-ends</label>
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-800 mb-1">Source de vélocité</label>
                <select
                  className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                  value={velocitySource}
                  onChange={e => setVelocitySource(e.target.value)}
                >
                  <option value="github">GitHub</option>
                  <option value="trello">Trello</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[180px]">
                  <label className="block font-medium text-gray-800 mb-1">Dépendances</label>
                  <input
                    className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                    value={dependencies}
                    onChange={e => setDependencies(e.target.value)}
                    placeholder="Ex : API externe, équipe data, etc."
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block font-medium text-gray-800 mb-1">Risques</label>
                  <input
                    className="rounded-md border px-3 py-2 w-full text-gray-800 bg-white"
                    value={risks}
                    onChange={e => setRisks(e.target.value)}
                    placeholder="Ex : instabilité API, dette technique, etc."
                  />
                </div>
              </div>
              <button
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded shadow disabled:opacity-50"
                disabled={isAnalyzing || !feature || !startDate}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? "Analyse en cours..." : "Analyser avec l'IA"}
              </button>
              {errorMsg && <div className="mt-2 text-red-600 text-sm">{errorMsg}</div>}
            </div>
          </StepLayout>
        </div>
        {/* Colonne 2 : Analyse IA & Découpage */}
        <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-4 min-w-[260px]">
          <StepLayout id="analyse" stepNumber={2} title={<span>Analyse IA</span>} icon={<FaRegListAlt />}> 
            <div className="text-gray-700 text-sm mb-2">
              Pour estimer les délais de livraison de la fonctionnalité <b>"{feature || '...' }"</b>, nous devons d'abord découper cette fonctionnalité en plusieurs tâches techniques. Voici une décomposition possible :
            </div>
          </StepLayout>
          <StepLayout id="decoupage" stepNumber={3} title={<span>Tâches techniques</span>} icon={<FaRegListAlt />}> 
            <table className="min-w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Tâches</th>
                  <th className="text-left py-2 font-medium">Estimation</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={2} className="text-center text-gray-400 italic">Veuillez lancer l'analyse IA.</td></tr>
                ) : (
                  tasks.map((t, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{t.name}</td>
                      <td className="py-2">{t.days} jours</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="mt-4 font-bold text-right text-gray-800">
              Total estimé : {totalDays + buffer} jours {buffer > 0 && <span className="text-xs text-orange-500">(buffer inclus)</span>}
            </div>
          </StepLayout>
        </div>
        {/* Colonne 3 : Conclusion */}
        <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-4 min-w-[260px]">
          <StepLayout id="conclusion" stepNumber={4} title={<span>Conclusion</span>} icon={<FaRegCheckCircle />}> 
            <div className="text-gray-800 text-sm">
              {aiText ? (
                <div>{aiText}</div>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>
              )}
              {aiCorrection && <div className="text-sm text-orange-600">{aiCorrection}</div>}
              <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded shadow" disabled={aiText === ""}>Exporter la conclusion en PDF</button>
            </div>
          </StepLayout>
          <StepLayout id="livraison" stepNumber={5} title={<span>Livraison estimée</span>} icon={<FaRegCalendarAlt />}> 
            <div className="text-gray-800 text-lg font-bold">
              {deliveryDate ? (
                <span>Livraison estimée : <span className="text-green-600">{deliveryDate}</span></span>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-semibold">Score de confiance IA :</span>
              {confidenceScore !== null ? (
                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">{confidenceScore}%</span>
              ) : (
                <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>
              )}
              <button
                className="text-xs underline text-blue-600"
                onClick={() => setShowScoreDetails(v => !v)}
                disabled={scoreDetails.length === 0}
              >
                {showScoreDetails ? "Masquer les détails" : "Détails"}
              </button>
            </div>
            {showScoreDetails && scoreDetails.length > 0 && (
              <ul className="ml-4 list-disc text-sm">
                {scoreDetails.map((f, i) => (
                  <li key={i}>{f.label} <span className="ml-2 font-mono">{f.value > 0 ? "+" : ""}{f.value}</span></li>
                ))}
              </ul>
            )}
          </StepLayout>
        </div>
        {/* Colonne 4 : Feedback & exports */}
        <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-4 min-w-[260px]">
          <StepLayout id="feedback" stepNumber={6} title={<span>Feedback & historique</span>} icon={<FaRegCommentDots />}> 
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="font-medium text-gray-800">Votre note (NPS) :</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className="rounded-md border px-3 py-2 w-16 text-gray-800 bg-white"
                  value={nps}
                  onChange={e => setNps(e.target.value)}
                />
                <input
                  type="text"
                  className="rounded-md border px-3 py-2 flex-1 text-gray-800 bg-white"
                  placeholder="Un commentaire ?"
                  value={npsComment}
                  onChange={e => setNpsComment(e.target.value)}
                />
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                  onClick={handleSendNps}
                  disabled={!nps}
                >Envoyer</button>
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
          </StepLayout>
          <StepLayout id="exports" stepNumber={7} title={<span>Exports</span>} icon={<FaRegFolderOpen />}> 
            <ExportCenter enabled={exportReady} />
          </StepLayout>
        </div>
      </div>
    </div>
  );
} 
