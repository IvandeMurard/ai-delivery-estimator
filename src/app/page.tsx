'use client'

import { useState, useRef } from "react"
import { Fragment } from "react"

function extractTotalDays(response: string): number {
  const match = response.match(/total.*?(\d+([.,]\d+)?)/i)
  if (!match) return 1 // fallback
  return parseFloat(match[1].replace(',', '.'))
}

function extractDeliveryDate(response: string): string | null {
  // Cherche la date au format 'Livraison estimée : jj/mm/aaaa'
  const match = response.match(/Livraison estimée\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)
  return match ? match[1] : null
}

function extractAdvancedSection(response: string): string | null {
  // Cherche la section 'Calculs secondaires' (ou autre nice to have)
  const match = response.match(/(Calculs secondaires[\s\S]*)/i)
  return match ? match[1].trim() : null
}

export default function Home() {
  const [feature, setFeature] = useState("")
  const [result, setResult] = useState("")
  const [capacity, setCapacity] = useState(1)
  const [integrationLevel, setIntegrationLevel] = useState("")
  const [dataConcern, setDataConcern] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAdvancedFields, setShowAdvancedFields] = useState(false)
  const capacityInputRef = useRef<HTMLInputElement>(null)
  // Pour le workflow de suggestion/validation des tâches
  const [suggestedTasks, setSuggestedTasks] = useState<string[] | null>(null)
  const [tasks, setTasks] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isEditingTasks, setIsEditingTasks] = useState(false)

  const handleSubmit = async () => {
    setResult("Analyse en cours...")
    setShowAdvanced(false)

    // On envoie la liste validée des tâches à l'API d'estimation
    const response = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature,
        capacity,
        dataConcern,
        integrationLevel,
        startDate,
        tasks,
      })
    })
    const data = await response.json()
    setResult(data.output)
  }

  // Suggestion de tâches via API
  const handleSuggestTasks = async () => {
    setIsSuggesting(true)
    setSuggestedTasks(null)
    setIsEditingTasks(false)
    const response = await fetch("/api/suggest-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature })
    })
    const data = await response.json()
    setSuggestedTasks(data.tasks)
    setTasks(data.tasks)
    setIsSuggesting(false)
    setIsEditingTasks(true)
  }

  // Edition des tâches (ajout, suppression, édition inline, drag & drop simple)
  const handleTaskChange = (idx: number, value: string) => {
    setTasks(tasks => tasks.map((t, i) => i === idx ? value : t))
  }
  const handleTaskDelete = (idx: number) => {
    setTasks(tasks => tasks.filter((_, i) => i !== idx))
  }
  const handleTaskAdd = () => {
    setTasks(tasks => [...tasks, ""])
  }
  const handleTaskMove = (from: number, to: number) => {
    setTasks(tasks => {
      const copy = [...tasks]
      const [moved] = copy.splice(from, 1)
      copy.splice(to, 0, moved)
      return copy
    })
  }

  const deliveryDate = extractDeliveryDate(result)
  const advancedSection = extractAdvancedSection(result)

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-extrabold mb-8 text-blue-800">💡 Estimation par IA</h1>

      <section className="w-full max-w-xl bg-white p-6 rounded shadow mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Décris ta fonctionnalité</h2>
        <textarea
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          placeholder="Décris ta fonctionnalité ici..."
          className="w-full p-4 border border-gray-300 rounded mb-4 text-gray-900"
          rows={5}
        />

        <label className="block text-2xl font-bold mb-4 text-gray-800">👥 Nombre de développeurs</label>
        <div className="flex gap-2 mb-4">
          <input
            ref={capacityInputRef}
            type="number"
            min={1}
            max={10}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            placeholder="Nombre de développeurs"
            className="w-full p-2 border border-gray-300 rounded text-gray-900"
          />
          <button
            className="bg-gray-300 px-3 rounded text-sm font-bold text-gray-800 hover:bg-gray-400 border border-gray-400"
            onClick={() => {
              if (capacityInputRef.current) capacityInputRef.current.focus()
              handleSubmit()
            }}
          >
            Recalculer avec X devs
          </button>
        </div>

        {/* Bouton pour afficher/masquer les champs avancés */}
        <button
          type="button"
          className="mb-4 text-blue-600 underline text-sm"
          onClick={() => setShowAdvancedFields((v) => !v)}
        >
          {showAdvancedFields ? "Masquer les champs avancés" : "Afficher les champs avancés"}
        </button>

        {/* Champs avancés */}
        {showAdvancedFields && (
          <>
            <label className="block font-semibold mt-4 text-gray-900">📅 Date de démarrage</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-900"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <label className="block font-semibold mt-4 text-blue-700">🔄 Niveau d'intégration SI</label>
            <select
              className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-900"
              value={integrationLevel}
              onChange={(e) => setIntegrationLevel(e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              <option value="Fonction autonome, sans dépendance SI">Aucune intégration</option>
              <option value="Intégration légère via API ou webhook">Interfaçage simple</option>
              <option value="Intégration profonde dans plusieurs systèmes (ERP, CRM...)" >Intégration SI complexe</option>
            </select>

            <label className="block font-semibold mt-4 text-purple-700">📊 Problématique de données</label>
            <div className="mb-4 flex flex-col gap-2">
              {[
                "Aucune problématique de données",
                "Données à migrer ou à nettoyer",
                "Connexion à des sources de données externes",
                "Respect de la RGPD ou contraintes légales"
              ].map(option => (
                <label key={option} className="flex items-center gap-2 text-gray-900">
                  <input
                    type="checkbox"
                    value={option}
                    checked={dataConcern.includes(option)}
                    onChange={e => {
                      if (e.target.checked) {
                        setDataConcern([...dataConcern, option])
                      } else {
                        setDataConcern(dataConcern.filter(v => v !== option))
                      }
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </>
        )}

        {/* Workflow suggestion/validation des tâches */}
        {!isEditingTasks && (
          <button
            onClick={handleSuggestTasks}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
            disabled={isSuggesting || !feature.trim()}
          >
            {isSuggesting ? "Découpage en cours..." : "Découper en tâches"}
          </button>
        )}
        {/* Affichage et édition des tâches */}
        {isEditingTasks && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2 text-blue-800">Découpage proposé</h3>
            <ul className="mb-4">
              {tasks.map((task, idx) => (
                <li key={idx} className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 select-none cursor-move"
                    title="Glisser pour réordonner"
                    draggable
                    onDragStart={e => e.dataTransfer.setData('text/plain', idx.toString())}
                    onDrop={e => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData('text/plain'));
                      handleTaskMove(from, idx);
                    }}
                    onDragOver={e => e.preventDefault()}
                  >☰</span>
                  <input
                    className="flex-1 p-2 border border-gray-300 rounded text-gray-900"
                    value={task}
                    onChange={e => handleTaskChange(idx, e.target.value)}
                  />
                  <button
                    className="ml-2 text-red-600 hover:text-red-800 font-bold"
                    onClick={() => handleTaskDelete(idx)}
                    title="Supprimer cette tâche"
                  >✕</button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mb-4">
              <button
                className="bg-gray-200 px-3 py-1 rounded text-gray-800 font-bold hover:bg-gray-300"
                onClick={handleTaskAdd}
              >+ Ajouter une tâche</button>
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                onClick={() => setIsEditingTasks(false)}
              >Modifier la description</button>
            </div>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 w-full"
              onClick={handleSubmit}
              disabled={tasks.length === 0 || tasks.some(t => !t.trim())}
            >Valider ce découpage et estimer</button>
          </div>
        )}
      </section>

      {result && (
        <section className="w-full max-w-2xl bg-white p-8 rounded-xl shadow mb-10 space-y-8">
          {/* Bloc vert date de livraison estimée (toujours affiché si trouvée) */}
          {(() => {
            let dateLivraison: string | null = null;
            const dateMatches = Array.from(result.matchAll(/Livraison estimée\s*:\s*(\d{2}\/\d{2}\/\d{4})/gi));
            if (dateMatches.length > 0) {
              dateLivraison = dateMatches[0][1];
            } else {
              const altDate = result.match(/(?:soit|le|aux alentours du|autour du)\s*(\d{2}\/\d{2}\/\d{4})/i);
              if (altDate) dateLivraison = altDate[1];
            }
            if (dateLivraison) {
              return (
                <div className="text-2xl font-extrabold text-green-800 flex items-center gap-2 bg-green-50 border border-green-200 rounded p-4 justify-center mb-6">
                  <span role="img" aria-label="date">📆</span>
                  <span>Livraison estimée :</span>
                  <span className="underline decoration-green-400">{dateLivraison}</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Bloc Tâches techniques sous forme de tableau, avec total déplacé ici */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Tâches techniques</h2>
            <table className="w-full text-left border-collapse mb-6">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="py-2 px-3 font-bold text-blue-800 text-lg w-3/4">Tâche</th>
                  <th className="py-2 px-3 font-bold text-blue-800 text-lg w-1/4">Estimation</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const taskLines = (result.match(/\d+\.\s.*?\-\s*\d+\s*jours?/g) || []);
                  let total = null;
                  const totalMatch = result.match(/Total\s*:\s*(\d+\s*jours? de travail)/i) || result.match(/Estimation totale\s*:?-?\s*(\d+\s*jours? de travail)/i);
                  if (totalMatch) total = totalMatch[1];
                  return <>
                    {taskLines.map((l, idx) => {
                      const match = l.match(/^\d+\.\s*(.*?)\s*-\s*(\d+\s*jours?)/);
                      return (
                        <tr key={idx} className="border-b border-blue-100">
                          <td className="py-2 px-3 align-top text-gray-900">{match ? match[1].trim() : l}</td>
                          <td className="py-2 px-3 align-top font-bold text-blue-800">{match ? match[2] : ''}</td>
                        </tr>
                      );
                    })}
                  </>;
                })()}
                {(() => {
                  const totalMatch = result.match(/Total\s*:\s*(\d+\s*jours? de travail)/i) || result.match(/Estimation totale\s*:?-?\s*(\d+\s*jours? de travail)/i);
                  if (totalMatch) {
                    return (
                      <tr>
                        <td className="py-3 px-3 align-top text-right font-bold text-blue-900 text-lg" colSpan={2}>
                          Estimation totale : <span className="text-pink-700">{totalMatch[1]}</span>
                        </td>
                      </tr>
                    );
                  }
                  return null;
                })()}
              </tbody>
            </table>
          </div>

          {/* Bloc Résumé (anciennement Conclusion, sans Tâches Techniques, plus aéré) */}
          {(() => {
            let resume = result
              .replace(/Livraison estimée\s*:\s*\d{2}\/\d{2}\/\d{4}/gi, "")
              .replace(/\d+\.\s.*?\-\s*\d+\s*jours?/g, "")
              .replace(/\|.*\|/g, "")
              .replace(/Calculs secondaires[\s\S]*/i, "")
              .replace(/Tâches techniques\s*:[\s\S]*?(?=Total|Estimation totale|\d+\s*jours? de travail|$)/i, "")
              .replace(/Total\s*:\s*\d+\s*jours? de travail|Estimation totale\s*:?-?\s*\d+\s*jours? de travail/i, "")
              .replace(/[\n\r]{2,}/g, '\n\n')
              .trim();
            const split = resume.split(/Total\s*:\s*\d+\s*jours? de travail|Estimation totale\s*:?-?\s*\d+\s*jours? de travail/i);
            resume = split.length > 1 ? split[1].trim() : resume;
            return resume ? (
              <div className="bg-gray-100 p-10 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Résumé</h3>
                <div className="text-gray-900 whitespace-pre-line leading-relaxed space-y-6">{resume}</div>
              </div>
            ) : null;
          })()}

          {advancedSection && (
            <>
              <div className="mb-4 border-b border-gray-200"></div>
              <button
                className="mt-2 text-blue-600 underline text-sm"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? "Masquer les infos avancées" : "Afficher plus (calculs secondaires)"}
              </button>
              {showAdvanced && (
                <section className="mt-4">
                  <h3 className="text-lg font-semibold text-yellow-700 mb-2">Calculs secondaires</h3>
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <pre className="whitespace-pre-wrap text-yellow-900">{advancedSection}</pre>
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      )}
    </main>
  )
}
