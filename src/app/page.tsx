"use client";

import { useState } from "react";

export default function Home() {
  const [feature, setFeature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);

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
      // Extraction robuste des tâches : capture le nom avant le ':'
      const lines = (data.output || "").split(/\n|\r/);
      const taskLines = lines.filter((l: string) => /^\s*(\d+\.|-)\s*[^:]+:/i.test(l));
      setTasks(taskLines.map((l: string) => {
        const match = l.match(/^\s*(?:\d+\.|-)\s*([^:]+):/i);
        return match ? match[1].trim() : l.trim();
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
              <ul className="list-disc pl-6 text-gray-700">
                {tasks.length === 0 ? (
                  <li className="text-gray-400">Aucune tâche proposée pour l'instant</li>
                ) : (
                  tasks.map((t, i) => <li key={i}>{t}</li>)
                )}
              </ul>
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
              <div className="text-gray-700">Date de livraison estimée : <span className="font-bold">--/--/----</span></div>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">Score de confiance : <span className="font-bold">--</span></span>
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
                <input type="number" min="0" max="10" className="border rounded p-2 w-16" placeholder="NPS" disabled />
                <input type="text" className="border rounded p-2 flex-1" placeholder="Commentaire (optionnel)" disabled />
                <button className="bg-blue-600 text-white px-4 py-2 rounded opacity-50 cursor-not-allowed" disabled>Envoyer</button>
              </div>
            </div>
            <div className="mt-4">
              <label className="font-medium">Historique des feedbacks</label>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Exemple de feedback 1</li>
                <li>Exemple de feedback 2</li>
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
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>📤 Export PDF</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>🧠 Export Notion</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>📋 Export CSV</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>✅ Export Trello</button>
              <button className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center opacity-50 cursor-not-allowed" disabled>🟠 Export JIRA</button>
            </div>
            <div className="mt-2 text-gray-500 text-xs">Exports désactivés (structure uniquement)</div>
          </div>
        </section>
      </div>
    </main>
  );
}
