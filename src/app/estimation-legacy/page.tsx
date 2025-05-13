"use client";

import { useState } from "react";
import StepLayout from "../components/StepLayout";
import { FaRegFileAlt, FaRegListAlt, FaRegCalendarAlt, FaRegCheckCircle, FaRegCommentDots, FaRegFolderOpen } from "react-icons/fa";
import Link from "next/link";

// Définir le type Task pour le découpage & estimation
type Task = {
  name: string;
  days: number;
  tool: string;
  // ajoute d'autres propriétés si besoin
};

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
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [scoreDetails, setScoreDetails] = useState([]);
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
      const data: { tasks: Task[]; totalDays: number; buffer: number; deliveryDate: string; confidenceScore: number; scoreDetails: any[]; aiCorrection: string; aiText: string } = await res.json();
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
    <div className="max-w-screen-lg mx-auto space-y-8 px-2 sm:px-6 py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span role="img" aria-label="bulb">💡</span> Estimation par IA (Version Legacy)
        </h1>
        <Link href="/" className="text-blue-600 underline font-medium hover:text-blue-800">Retour à la landing page</Link>
      </div>
      {/* Saisie & contexte */}
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

      {/* Découpage & estimation */}
      <StepLayout id="decoupage" stepNumber={2} title={<span>Découpage & estimation</span>} icon={<FaRegListAlt />}> 
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Tâche</th>
                <th className="text-left py-2 font-medium">Durée (jours)</th>
                <th className="text-left py-2 font-medium">Outils recommandés</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-gray-400 italic">Veuillez lancer l'analyse IA.</td></tr>
              ) : (
                (tasks as Task[]).map((t, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{t.name}</td>
                    <td className="py-2">{t.days}</td>
                    <td className="py-2">{t.tool}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="mt-4 font-bold text-right text-gray-800">
            Total : {totalDays + buffer} jours {buffer > 0 && <span className="text-xs text-orange-500">(buffer inclus)</span>}
          </div>
        </div>
      </StepLayout>

      {/* Livraison & scoring */}
      <StepLayout id="livraison" stepNumber={3} title={<span>Livraison & scoring</span>} icon={<FaRegCalendarAlt />}> 
        <div className="space-y-2 text-gray-800">
          <div>
            <span className="font-semibold">Date de livraison estimée :</span> {deliveryDate || <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>}
          </div>
          <div className="flex items-center gap-3">
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
        </div>
      </StepLayout>

      {/* Résultat / conclusion */}
      <StepLayout id="resultat" stepNumber={4} title={<span>Résultat / conclusion</span>} icon={<FaRegCheckCircle />}> 
        <div className="space-y-2 text-gray-800">
          <div>{aiText || <span className="text-gray-400 italic">Veuillez lancer l'analyse IA.</span>}</div>
          {aiCorrection && <div className="text-sm text-orange-600">{aiCorrection}</div>}
          <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded shadow" disabled={aiText === ""}>Exporter en PDF</button>
        </div>
      </StepLayout>

      {/* Feedback & historique */}
      <StepLayout id="feedback" stepNumber={5} title={<span>Feedback & historique</span>} icon={<FaRegCommentDots />}> 
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

      {/* Exports */}
      <StepLayout id="exports" stepNumber={6} title={<span>Exports</span>} icon={<FaRegFolderOpen />}> 
        <ExportCenter enabled={exportReady} />
      </StepLayout>
    </div>
  );
} 