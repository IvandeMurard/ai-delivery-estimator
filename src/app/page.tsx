'use client'

import { useState, useRef, useEffect } from "react"
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
  // Pour le scan du codebase
  const [codebaseStructure, setCodebaseStructure] = useState<string[] | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  // Pour GitHub OAuth et vélocité
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubVelocity, setGithubVelocity] = useState<{ avgPerWeek: number, avgDuration: number } | null>(null)
  const [githubIssues, setGithubIssues] = useState<any[]>([])
  // Gestion des erreurs utilisateur
  const [error, setError] = useState<string | null>(null)
  // Pour le choix du repo
  const [githubOwner, setGithubOwner] = useState<string>(process.env.NEXT_PUBLIC_GITHUB_OWNER || '')
  const [githubRepo, setGithubRepo] = useState<string>(process.env.NEXT_PUBLIC_GITHUB_REPO || '')
  // Pour la gestion de la capacité de l'équipe
  const [showCapacity, setShowCapacity] = useState(false)
  const [team, setTeam] = useState<{ name: string, percent: number, comment: string }[]>([])
  // Capacité totale calculée
  const totalCapacity = team.reduce((sum, m) => sum + (Number(m.percent) || 0), 0)
  // Feedback post-livraison
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackEstimation, setFeedbackEstimation] = useState("")
  const [feedbackReal, setFeedbackReal] = useState("")
  const [feedbackComment, setFeedbackComment] = useState("")
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  // Historique des feedbacks
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([])

  const handleScanCodebase = async () => {
    setIsScanning(true)
    setCodebaseStructure(null)
    setError(null)
    const res = await fetch('/api/scan-codebase')
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setIsScanning(false)
      return
    }
    setCodebaseStructure(data.structure)
    setIsScanning(false)
  }

  const handleSubmit = async () => {
    setResult("Analyse en cours...")
    setShowAdvanced(false)
    setError(null)

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
        codebaseStructure,
        githubVelocity,
        team,
        totalCapacity,
      })
    })
    const data = await response.json()
    if (data.error) {
      setError(data.error)
      setResult("")
      return
    }
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

  // Adaptation de la récupération des tickets selon le repo choisi
  useEffect(() => {
    if (!githubOwner || !githubRepo) return;
    (async () => {
      try {
        const res = await fetch(`/api/github/issues?owner=${encodeURIComponent(githubOwner)}&repo=${encodeURIComponent(githubRepo)}`)
        if (res.status === 200) {
          setGithubConnected(true)
          const data = await res.json()
          setGithubIssues(data.tickets)
          // Calcul vélocité simple
          const closed = data.tickets.filter((i: any) => i.closed_at)
          if (closed.length > 0) {
            // Tickets fermés par semaine
            const weeks: { [week: string]: number } = {}
            let totalDuration = 0
            closed.forEach((i: any) => {
              const created = new Date(i.created_at)
              const closedAt = new Date(i.closed_at)
              const week = `${closedAt.getFullYear()}-W${Math.ceil((closedAt.getDate() + ((closedAt.getDay() + 6) % 7)) / 7)}`
              weeks[week] = (weeks[week] || 0) + 1
              totalDuration += (closedAt.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            })
            const avgPerWeek = Object.values(weeks).reduce((a, b) => a + b, 0) / Object.keys(weeks).length
            const avgDuration = totalDuration / closed.length
            setGithubVelocity({ avgPerWeek, avgDuration })
          }
        } else {
          setGithubConnected(false)
          const data = await res.json()
          if (data.error) setError(data.error)
        }
      } catch {
        setGithubConnected(false)
        setError("Erreur lors de la connexion à GitHub.")
      }
    })()
  }, [githubOwner, githubRepo])

  const handleSendFeedback = async () => {
    setFeedbackSuccess(false)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimation: feedbackEstimation, realDuration: feedbackReal, comment: feedbackComment })
    })
    const data = await res.json()
    if (data.success) {
      setFeedbackSuccess(true)
      setShowFeedback(false)
      setFeedbackEstimation("")
      setFeedbackReal("")
      setFeedbackComment("")
    }
  }

  // Historique des feedbacks
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      if (data.feedbacks) {
        setFeedbackHistory(data.feedbacks.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      }
    })()
  }, [feedbackSuccess])

  return (
    <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-extrabold mb-12 text-blue-800 w-full text-center">💡 Estimation par IA</h1>

      <div className="w-full max-w-screen-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Bloc 1 : Saisie & contexte */}
        <section className="bg-white p-8 rounded-xl shadow border border-blue-100 flex flex-col gap-6 col-span-1">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Saisie & contexte</h2>
          {/* Etape 1 : Découpage en tâches techniques */}
          <div className="mb-4 pb-4 border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">1</span>
              <span className="text-lg font-bold text-blue-900">Découper la fonctionnalité en tâches techniques</span>
            </div>
            <textarea
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              placeholder="Décris ta fonctionnalité ici..."
              className="w-full p-4 border border-gray-300 rounded mb-2 text-gray-900"
              rows={4}
            />
            {/* Workflow suggestion/validation des tâches */}
            {!isEditingTasks && (
              <button
                onClick={handleSuggestTasks}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full mt-2"
                disabled={isSuggesting || !feature.trim()}
              >
                {isSuggesting ? "Découpage en cours..." : "Découper en tâches"}
              </button>
            )}
            {/* Affichage et édition des tâches */}
            {isEditingTasks && (
              <div className="mt-4">
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
          </div>
          {/* Etape 2 : Champs avancés (facultatif) */}
          <div className="mb-4 pb-4 border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">2</span>
              <span className="text-lg font-bold text-blue-900">Champs avancés <span className="text-xs text-blue-500">(facultatif)</span></span>
            </div>
            <button
              type="button"
              className="mb-2 text-blue-600 underline text-sm"
              onClick={() => setShowAdvancedFields((v) => !v)}
            >
              {showAdvancedFields ? "Masquer les champs avancés" : "Afficher les champs avancés"}
            </button>
            {showAdvancedFields && (
              <>
                <label className="block font-semibold mt-2 text-gray-900">📅 Date de démarrage</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded mb-2 text-gray-900"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <label className="block font-semibold mt-2 text-blue-700">🔄 Niveau d'intégration SI</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded mb-2 text-gray-900"
                  value={integrationLevel}
                  onChange={(e) => setIntegrationLevel(e.target.value)}
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Fonction autonome, sans dépendance SI">Aucune intégration</option>
                  <option value="Intégration légère via API ou webhook">Interfaçage simple</option>
                  <option value="Intégration profonde dans plusieurs systèmes (ERP, CRM...)" >Intégration SI complexe</option>
                </select>
                <label className="block font-semibold mt-2 text-purple-700">📊 Problématique de données</label>
                <div className="mb-2 flex flex-col gap-2">
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
          </div>
          {/* Etape 3 : Connexion GitHub (facultatif) */}
          <div className="mb-4 pb-4 border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">3</span>
              <span className="text-lg font-bold text-blue-900">Connexion GitHub <span className='text-xs text-blue-500'>(facultatif)</span></span>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Organisation/Utilisateur</label>
                <input
                  className="w-full p-2 border border-gray-300 rounded text-gray-900"
                  value={githubOwner}
                  onChange={e => setGithubOwner(e.target.value)}
                  placeholder="ex: mon-organisation"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nom du repo</label>
                <input
                  className="w-full p-2 border border-gray-300 rounded text-gray-900"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                  placeholder="ex: mon-repo"
                />
              </div>
            </div>
            <div className="mt-2">
              {!githubConnected ? (
                <button
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                  onClick={() => { window.location.href = '/api/github/oauth/start' }}
                >
                  Connecter GitHub
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                  <span className="font-bold text-green-800">Connecté à GitHub ✅</span>
                  <span className="text-xs text-gray-700 ml-2">Repo analysé : <b>{githubOwner}/{githubRepo}</b></span>
                  {githubVelocity && (
                    <span className="ml-2 text-green-900 text-xs">Vélocité : <b>{githubVelocity.avgPerWeek.toFixed(1)}</b> tickets/semaine, <b>{githubVelocity.avgDuration.toFixed(1)}</b> jours/ticket</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Etape 4 : Analyse du code existant (facultatif) */}
          <div className="mb-4 pb-4 border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">4</span>
              <span className="text-lg font-bold text-blue-900">Analyser le code existant <span className='text-xs text-blue-500'>(facultatif)</span></span>
            </div>
            <button
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-900"
              onClick={handleScanCodebase}
              disabled={isScanning}
            >
              {isScanning ? "Scan en cours..." : "Analyse votre codebase existant"}
            </button>
            {codebaseStructure && (
              <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-2">
                <div className="font-bold mb-1 text-gray-700 text-xs">Structure du code détectée :</div>
                <ul className="text-xs text-gray-800 max-h-24 overflow-auto">
                  {codebaseStructure.map((file, i) => (
                    <li key={i}>{file}</li>
                  ))}
                </ul>
                <div className="mt-1 text-gray-500 italic text-xs">Bientôt : analyse avancée des routes, composants, dépendances…</div>
              </div>
            )}
          </div>
          {/* Etape 5 : Capacité équipe */}
          <div className="mb-4 pb-4 border-b border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">5</span>
              <span className="text-lg font-bold text-blue-900">Prendre en compte la capacité de l'équipe</span>
            </div>
            <button
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-900 mb-2"
              onClick={() => setShowCapacity(v => !v)}
            >
              {showCapacity ? "Masquer la capacité de l'équipe" : "Prendre en compte la capacité de l'équipe"}
            </button>
            {showCapacity && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                <div className="font-bold mb-2 text-blue-800">Capacité de l'équipe</div>
                <table className="w-full text-xs mb-2">
                  <thead>
                    <tr>
                      <th className="text-left">Nom</th>
                      <th className="text-left">% temps</th>
                      <th className="text-left">Commentaires</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((m, idx) => (
                      <tr key={idx}>
                        <td><input className="p-1 border rounded w-full" value={m.name} onChange={e => setTeam(t => t.map((m2, i) => i === idx ? { ...m2, name: e.target.value } : m2))} placeholder="Nom" /></td>
                        <td><input type="number" min={0} max={100} className="p-1 border rounded w-20" value={m.percent} onChange={e => setTeam(t => t.map((m2, i) => i === idx ? { ...m2, percent: Number(e.target.value) } : m2))} placeholder="%" /></td>
                        <td><input className="p-1 border rounded w-full" value={m.comment} onChange={e => setTeam(t => t.map((m2, i) => i === idx ? { ...m2, comment: e.target.value } : m2))} placeholder="Commentaires, contraintes, indisponibilités..." /></td>
                        <td><button className="text-red-600 font-bold" onClick={() => setTeam(t => t.filter((_, i) => i !== idx))}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="bg-gray-200 px-2 py-1 rounded text-gray-800 font-bold hover:bg-gray-300 mb-2" onClick={() => setTeam(t => [...t, { name: '', percent: 100, comment: '' }])}>+ Ajouter un membre</button>
                <div className="mt-2 text-blue-900 font-semibold">Capacité totale : {totalCapacity}%</div>
                <div className="text-xs text-gray-500 mt-1">(La capacité totale est la somme des % temps de chaque membre. Les commentaires permettent d'ajouter toute contrainte ou indisponibilité.)</div>
              </div>
            )}
          </div>
          {/* Etape 6 */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">6</span>
              <span className="text-lg font-bold text-blue-900">Valider et estimer</span>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
            >
              Estimer
            </button>
          </div>
        </section>

        {/* Bloc 2 : Estimation IA */}
        <section className="bg-white p-8 rounded-xl shadow border border-green-100 flex flex-col gap-8 col-span-1">
          <h2 className="text-2xl font-bold mb-2 text-green-800">Estimation IA</h2>
          {result && (
            <div className="space-y-8">
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
                      <th className="py-2 px-3 font-bold text-blue-800 text-lg w-3/4">Tâches</th>
                      <th className="py-2 px-3 font-bold text-blue-800 text-lg w-1/4">Estimation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Extraction améliorée des tâches et estimations depuis le texte
                      // Cherche les lignes du type "1. ... : 2 jours" ou "- ... : 2 jours"
                      const taskLines = (result.match(/\d+\.\s.*?:\s*\d+\s*jours?/g) || result.match(/-\s.*?:\s*\d+\s*jours?/g) || []);
                      return taskLines.map((l, idx) => {
                        // Ex: "1. Analyse ... : 3 jours"
                        const match = l.match(/^(?:\d+\.|-)\s*(.*?)\s*:\s*(\d+\s*jours?)/);
                        return (
                          <tr key={idx} className="border-b border-blue-100">
                            <td className="py-2 px-3 align-top text-gray-900">{match ? match[1].trim() : l}</td>
                            <td className="py-2 px-3 align-top font-bold text-blue-800">{match ? match[2] : ''}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                {/* Total estimé en gras */}
                {(() => {
                  // Cherche le total dans le texte
                  const totalMatch = result.match(/total de (\d+) jours?/i) || result.match(/environ (\d+) jours?/i);
                  if (totalMatch) {
                    return (
                      <div className="text-right text-lg font-bold text-blue-900 mt-2">
                        Total estimé : <span className="text-pink-700 font-extrabold">{totalMatch[1]} jours</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Bloc Résumé (anciennement Conclusion, sans Tâches Techniques, plus aéré) */}
              {(() => {
                // Retire la partie Tâches Techniques du résumé
                let resume = result
                  .replace(/Livraison estimée\s*:\s*\d{2}\/\d{2}\/\d{4}/gi, "")
                  .replace(/\d+\.\s.*?:\s*\d+\s*jours?/g, "")
                  .replace(/-\s.*?:\s*\d+\s*jours?/g, "")
                  .replace(/\|.*\|/g, "")
                  .replace(/Calculs secondaires[\s\S]*/i, "")
                  .replace(/Tâches techniques\s*:[\s\S]*?(?=Total|Estimation totale|\d+\s*jours? de travail|$)/i, "")
                  .replace(/Total\s*:\s*\d+\s*jours? de travail|Estimation totale\s*:?-?\s*\d+\s*jours? de travail/i, "")
                  .replace(/[\n\r]{2,}/g, '\n\n')
                  .trim();
                // Met en gras les dates (jj/mm/aaaa)
                resume = resume.replace(/(\d{2}\/\d{2}\/\d{4})/g, '<b class="font-bold">$1</b>');
                // Met en gras le total de jours estimés (ex: "11 jours", "13 jours")
                resume = resume.replace(/(\d+\s*jours?)/gi, '<b class="font-bold">$1</b>');
                return resume ? (
                  <div className="bg-gray-100 p-10 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Résumé</h3>
                    <div className="text-gray-900 whitespace-pre-line leading-relaxed space-y-6" dangerouslySetInnerHTML={{ __html: resume }} />
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
            </div>
          )}
        </section>

        {/* Bloc 3 : Résumé */}
        <section className="bg-white p-8 rounded-xl shadow border border-gray-200 flex flex-col gap-8 col-span-1">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Résumé</h2>
          {(() => {
            let resume = result
              ? result
                .replace(/Livraison estimée\s*:\s*\d{2}\/\d{2}\/\d{4}/gi, "")
                .replace(/\d+\.\s.*?:\s*\d+\s*jours?/g, "")
                .replace(/-\s.*?:\s*\d+\s*jours?/g, "")
                .replace(/\|.*\|/g, "")
                .replace(/Calculs secondaires[\s\S]*/i, "")
                .replace(/Tâches techniques\s*:[\s\S]*?(?=Total|Estimation totale|\d+\s*jours? de travail|$)/i, "")
                .replace(/Total\s*:\s*\d+\s*jours? de travail|Estimation totale\s*:?-?\s*\d+\s*jours? de travail/i, "")
                .replace(/[\n\r]{2,}/g, '\n\n')
                .trim()
              : '';
            resume = resume.replace(/(\d{2}\/\d{2}\/\d{4})/g, '<b class="font-bold">$1</b>');
            resume = resume.replace(/(\d+\s*jours?)/gi, '<b class="font-bold">$1</b>');
            return resume ? (
              <div className="text-gray-900 whitespace-pre-line leading-relaxed space-y-6" dangerouslySetInnerHTML={{ __html: resume }} />
            ) : null;
          })()}
        </section>

        {/* Bloc 4 : Feedback & historique */}
        <section className="bg-white p-8 rounded-xl shadow border border-yellow-100 flex flex-col gap-8 col-span-1">
          <h2 className="text-2xl font-bold mb-2 text-yellow-800">Feedback & historique</h2>
          {/* Feedback post-livraison */}
          {result && (
            <div className="mb-8">
              {!showFeedback && (
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  onClick={() => {
                    setShowFeedback(true)
                    setFeedbackEstimation(extractTotalDays(result).toString())
                  }}
                >
                  Saisir le feedback post-livraison
                </button>
              )}
              {showFeedback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mt-4">
                  <div className="mb-2 font-bold text-yellow-800">Feedback post-livraison</div>
                  <div className="mb-2">
                    <label className="block text-sm font-bold mb-1">Estimation initiale (jours)</label>
                    <input type="number" className="p-2 border rounded w-full" value={feedbackEstimation} onChange={e => setFeedbackEstimation(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-bold mb-1">Durée réelle (jours)</label>
                    <input type="number" className="p-2 border rounded w-full" value={feedbackReal} onChange={e => setFeedbackReal(e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-bold mb-1">Commentaire</label>
                    <textarea className="p-2 border rounded w-full" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} rows={3} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" onClick={handleSendFeedback}>Envoyer</button>
                    <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowFeedback(false)}>Annuler</button>
                  </div>
                </div>
              )}
              {feedbackSuccess && (
                <div className="mt-2 text-green-700 font-bold">Merci pour votre feedback !</div>
              )}
            </div>
          )}
          {/* Historique des feedbacks */}
          <div>
            <div className="font-bold text-gray-800 mb-2">Historique des feedbacks</div>
            {feedbackHistory.length === 0 && <div className="text-gray-500 text-sm">Aucun feedback enregistré pour l'instant.</div>}
            {feedbackHistory.length > 0 && (
              <table className="w-full text-xs border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Estimation (j)</th>
                    <th className="p-2 text-left">Réel (j)</th>
                    <th className="p-2 text-left">Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackHistory.map((f, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="p-2">{new Date(f.date).toLocaleDateString()}</td>
                      <td className="p-2">{f.estimation}</td>
                      <td className="p-2">{f.realDuration}</td>
                      <td className="p-2">{f.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
