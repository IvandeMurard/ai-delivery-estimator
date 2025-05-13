"use client";

import { useState } from "react";
import StepLayout from "./components/StepLayout";
import { FaRegFileAlt, FaRegListAlt, FaRegCalendarAlt, FaRegCheckCircle, FaRegCommentDots, FaRegFolderOpen } from "react-icons/fa";

// Dummy ExportCenter (à remplacer par le vrai composant si existant)
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

export default function Home() {
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

  // Découpage & estimation (mock)
  const [tasks, setTasks] = useState([
    { name: "Découper le backend", days: 2, tool: "GitHub" },
    { name: "Créer l'UI", days: 3, tool: "Figma" },
    { name: "Tests & QA", days: 1, tool: "Jest" },
  ]);
  const totalDays = tasks.reduce((sum, t) => sum + t.days, 0);
  const buffer = dependencies.includes("critique") ? 2 : 0;

  // Livraison & scoring (mock)
  const [deliveryDate, setDeliveryDate] = useState("15/07/2024");
  const [confidenceScore, setConfidenceScore] = useState(82);
  const [scoreDetails, setScoreDetails] = useState([
    { label: "Dépendances critiques", value: -10 },
    { label: "Vélocité historique", value: +20 },
    { label: "Risques déclarés", value: -8 },
    { label: "Capacité équipe", value: +5 },
    { label: "Dispersion estimation", value: -5 },
  ]);
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Résultat / conclusion (mock)
  const [aiCorrection, setAiCorrection] = useState("+2 jours pour marge historique");
  const [aiText, setAiText] = useState("L'estimation IA prend en compte la vélocité, la capacité, les dépendances et les risques pour fournir une date de livraison réaliste.");

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

  return (
    <div className="max-w-screen-lg mx-auto px-6 py-10 space-y-12">
      {/* Saisie & contexte */}
      <StepLayout id="saisie" title="🧾 Saisie & contexte" icon={<FaRegFileAlt />}>
        <div className="space-y-4">
          <div>
            <label className="font-semibold">Description de la fonctionnalité *</label>
            <textarea
              className="w-full border rounded p-2 mt-1"
              rows={3}
              value={feature}
              onChange={e => setFeature(e.target.value)}
              placeholder="Ex : Authentification Google, dashboard, etc."
              required
            />
          </div>
          <div>
            <label className="font-semibold">Date de démarrage *</label>
            <input
              type="date"
              className="border rounded p-2 mt-1"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="font-semibold">Capacité équipe (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="border rounded p-2 w-20 mt-1"
                value={teamCapacity}
                onChange={e => setTeamCapacity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="font-semibold">Jours d'absence</label>
              <input
                type="number"
                min={0}
                className="border rounded p-2 w-20 mt-1"
                value={teamAbsences}
                onChange={e => setTeamAbsences(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={excludeWeekends}
                onChange={e => setExcludeWeekends(e.target.checked)}
                id="weekends"
              />
              <label htmlFor="weekends">Exclure les week-ends</label>
            </div>
          </div>
          <div>
            <label className="font-semibold">Source de vélocité</label>
            <select
              className="border rounded p-2 mt-1"
              value={velocitySource}
              onChange={e => setVelocitySource(e.target.value)}
            >
              <option value="github">GitHub</option>
              <option value="trello">Trello</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <label className="font-semibold">Dépendances</label>
              <input
                className="border rounded p-2 w-full mt-1"
                value={dependencies}
                onChange={e => setDependencies(e.target.value)}
                placeholder="Ex : API externe, équipe data, etc."
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Risques</label>
              <input
                className="border rounded p-2 w-full mt-1"
                value={risks}
                onChange={e => setRisks(e.target.value)}
                placeholder="Ex : instabilité API, dette technique, etc."
              />
            </div>
          </div>
          <button
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded shadow disabled:opacity-50"
            disabled={isAnalyzing || !feature || !startDate}
            onClick={() => setIsAnalyzing(true)}
          >
            {isAnalyzing ? "Analyse en cours..." : "Analyser avec l'IA"}
          </button>
        </div>
      </StepLayout>

      {/* Découpage & estimation */}
      <StepLayout id="decoupage" title="🔍 Découpage & estimation" icon={<FaRegListAlt />}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tâche</th>
                <th className="text-left py-2">Durée (jours)</th>
                <th className="text-left py-2">Outils recommandés</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2">{t.days}</td>
                  <td className="py-2">{t.tool}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 font-bold text-right">
            Total : {totalDays + buffer} jours {buffer > 0 && <span className="text-xs text-orange-500">(buffer inclus)</span>}
          </div>
        </div>
      </StepLayout>

      {/* Livraison & scoring */}
      <StepLayout id="livraison" title="📆 Livraison & scoring" icon={<FaRegCalendarAlt />}>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Date de livraison estimée :</span> {deliveryDate}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Score de confiance IA :</span>
            <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 font-bold">{confidenceScore}%</span>
            <button
              className="text-xs underline text-blue-600"
              onClick={() => setShowScoreDetails(v => !v)}
            >
              {showScoreDetails ? "Masquer les détails" : "Détails"}
            </button>
          </div>
          {showScoreDetails && (
            <ul className="ml-4 list-disc text-sm">
              {scoreDetails.map((f, i) => (
                <li key={i}>{f.label} <span className="ml-2 font-mono">{f.value > 0 ? "+" : ""}{f.value}</span></li>
              ))}
            </ul>
          )}
        </div>
      </StepLayout>

      {/* Résultat / conclusion */}
      <StepLayout id="resultat" title="📄 Résultat / conclusion" icon={<FaRegCheckCircle />}>
        <div className="space-y-2">
          <div className="text-gray-700">{aiText}</div>
          <div className="text-sm text-orange-600">{aiCorrection}</div>
          <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded shadow">Exporter en PDF</button>
        </div>
      </StepLayout>

      {/* Feedback & historique */}
      <StepLayout id="feedback" title="💬 Feedback & historique" icon={<FaRegCommentDots />}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Votre note (NPS) :</label>
            <input
              type="number"
              min={0}
              max={10}
              className="border rounded p-2 w-16"
              value={nps}
              onChange={e => setNps(e.target.value)}
            />
            <input
              type="text"
              className="border rounded p-2 flex-1"
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
              <div className="font-semibold text-xs mb-1">Historique :</div>
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
      <StepLayout id="exports" title="🗂️ Exports" icon={<FaRegFolderOpen />}>
        <ExportCenter enabled={exportReady} />
      </StepLayout>
    </div>
  );
}
