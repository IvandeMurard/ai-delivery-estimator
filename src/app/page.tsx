"use client";

import { useState } from "react";

export default function Home() {
  const [feature, setFeature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [tasks, setTasks] = useState<{ name: string; days: number }[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [nps, setNps] = useState("");
  const [npsComment, setNpsComment] = useState("");
  const [npsLoading, setNpsLoading] = useState(false);
  const [npsHistory, setNpsHistory] = useState<{ nps: string; comment: string; date: string }[]>([]);
  const [exportStatus, setExportStatus] = useState<string>("");

  const handleAnalyze = async () => {
    if (!feature) return;
    setIsLoading(true);
    setResult("");
    setTasks([]);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature })
      });
      const data = await res.json();
      setResult(data.output || "");
      setConfidenceScore(typeof data.confidenceScore === 'number' ? data.confidenceScore : null);
      // Extraction de la date de livraison estimée (ex: 'Date de livraison estimée : 12/07/2024')
      const dateMatch = (data.output || "").match(/date de livraison estimée\s*[:\-–]?\s*([\w\d\/\-]+)/i);
      setDeliveryDate(dateMatch ? dateMatch[1] : "");
      // Extraction robuste des tâches : capture le nom et le nombre de jours
      const lines = (data.output || "").split(/\n|\r/);
      const taskLines = lines.filter((l: string) => /^\s*(\d+\.|-)\s*[^:]+:/i.test(l));
      setTasks(taskLines.map((l: string) => {
        const match = l.match(/^\s*(?:\d+\.|-)\s*([^:]+):\s*(\d+)\s*jours?/i);
        return match ? { name: match[1].trim(), days: parseInt(match[2], 10) } : { name: l.trim(), days: 0 };
      }));
    } catch {
      setResult("Erreur lors de l'analyse IA");
    }
    setIsLoading(false);
  };

  const handleEstimate = () => {
    // Placeholder : pour l'instant, ne fait rien de plus
    // On pourra y ajouter la logique d'estimation détaillée plus tard
  };

  const handleSendNps = async () => {
    if (!nps) return;
    setNpsLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nps, comment: npsComment, date: new Date().toISOString() })
      });
      setNpsHistory([{ nps, comment: npsComment, date: new Date().toLocaleString() }, ...npsHistory]);
      setNps("");
      setNpsComment("");
    } finally {
      setNpsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!tasks.length) return;
    const csv = [
      ['Tâche', 'Jours'],
      ...tasks.map(t => [t.name, t.days > 0 ? t.days : ''])
    ].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estimation.csv';
    a.click();
    setExportStatus('Export CSV téléchargé ✅');
    setTimeout(() => setExportStatus(''), 3000);
  };

  return (
    <main className="flex flex-col items-center bg-gray-50 w-full min-h-screen">
      {/* StepNav : sticky top sur mobile, fixed sur desktop */}
      {/* <StepNav steps={steps} /> */}
      <h1 className="text-4xl font-extrabold mb-4 text-blue-800 w-full text-center">💡 Estimation par IA <span className='text-lg font-normal text-gray-400'>(en reconstruction)</span></h1>

      <div className="w-full max-w-screen-md mx-auto">
        <section className="bg-white rounded-lg p-6 shadow-sm border border-blue-50 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            {/* <Pen className="w-6 h-6 text-blue-500" /> */}
            Saisie & contexte
          </h2>
          <div className="w-full flex flex-col gap-6 md:gap-8 mb-8">
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <label htmlFor="feature" className="font-medium mb-2">Décris la fonctionnalité à estimer</label>
              <textarea
                id="feature"
                className="border rounded p-2 min-h-[80px]"
                placeholder="Ex : Permettre à l'utilisateur de ..."
                value={feature}
                onChange={e => setFeature(e.target.value)}
                disabled={isLoading}
              />
              <button
                className={`mt-4 bg-blue-600 text-white px-4 py-2 rounded ${!feature || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!feature || isLoading}
                onClick={handleAnalyze}
              >
                {isLoading ? 'Analyse en cours...' : "Analyser avec l'IA"}
              </button>
            </div>
          </div>
        </section>

        {/* Bloc Découpage & estimation */}
        <section className="bg-white rounded-lg p-6 shadow-sm border border-blue-50 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            {/* <Brain className="w-6 h-6 text-blue-500" /> */}
            Découpage & estimation
          </h2>
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Tâches proposées</label>
              {tasks.length === 0 ? (
                <div className="text-gray-400">Aucune tâche proposée pour l'instant</div>
              ) : (
                <table className="w-full border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1 text-left">Tâche technique</th>
                      <th className="border px-2 py-1 text-left">Nombre de jours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{t.name}</td>
                        <td className="border px-2 py-1">{t.days > 0 ? t.days : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-100">
                      <td className="border px-2 py-1 text-right">Total</td>
                      <td className="border px-2 py-1">{tasks.reduce((sum, t) => sum + (t.days || 0), 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
            <button
              className={`mt-4 bg-blue-600 text-white px-4 py-2 rounded ${tasks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={tasks.length === 0}
              onClick={handleEstimate}
            >
              Générer estimation
            </button>
          </div>
        </section>

        {/* Bloc Livraison & scoring */}
        <section className="bg-white rounded-lg p-6 shadow-sm border border-blue-50 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            {/* <Calendar className="w-6 h-6 text-blue-500" /> */}
            Livraison & scoring
          </h2>
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Estimation finale</label>
              <div className="text-gray-700">Date de livraison estimée : <span className="font-bold">{deliveryDate || '--/--/----'}</span></div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Score de confiance : <span className="font-bold">{confidenceScore !== null ? confidenceScore : '--'}</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* Bloc Feedback NPS */}
        <section className="bg-white rounded-lg p-6 shadow-sm border border-blue-50 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            {/* <ThumbsUp className="w-6 h-6 text-blue-500" /> */}
            Feedback NPS
          </h2>
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-medium">Votre avis sur l'estimation</label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="border rounded p-2 w-16"
                  placeholder="NPS"
                  value={nps}
                  onChange={e => setNps(e.target.value)}
                  disabled={npsLoading}
                />
                <input
                  type="text"
                  className="border rounded p-2 flex-1"
                  placeholder="Commentaire (optionnel)"
                  value={npsComment}
                  onChange={e => setNpsComment(e.target.value)}
                  disabled={npsLoading}
                />
                <button
                  className={`bg-blue-600 text-white px-4 py-2 rounded ${!nps || npsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!nps || npsLoading}
                  onClick={handleSendNps}
                >
                  {npsLoading ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
            <div className="mt-4">
              <label className="font-medium">Historique des feedbacks</label>
              <ul className="list-disc pl-6 text-gray-700">
                {npsHistory.length === 0 ? (
                  <li className="text-gray-400">Aucun feedback pour l'instant</li>
                ) : (
                  npsHistory.map((f, i) => (
                    <li key={i}><span className="font-bold">{f.nps}</span> – {f.comment} <span className="text-xs text-gray-400">({f.date})</span></li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Bloc Exports */}
        <section className="bg-white rounded-lg p-6 shadow-sm border border-blue-50 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            {/* <CheckCircle className="w-6 h-6 text-blue-500" /> */}
            Exports
          </h2>
          <div className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center ${!tasks.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!tasks.length}
                onClick={handleExportCSV}
              >
                📋 Export CSV
              </button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>📤 Export PDF</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>🧠 Export Notion</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>✅ Export Trello</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>🟠 Export JIRA</button>
            </div>
            {exportStatus && <div className="mt-2 text-green-600 text-sm">{exportStatus}</div>}
            <div className="mt-2 text-gray-500 text-xs">Seul l'export CSV est actif pour l'instant</div>
          </div>
        </section>
      </div>
    </main>
  );
}
