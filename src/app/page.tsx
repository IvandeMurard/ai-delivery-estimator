'use client'

import { useState, useRef, useEffect } from "react"
import { Fragment } from "react"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { EstimationPDF } from './components/EstimationPDF'
import { ConclusionPDF } from './components/ConclusionPDF'
import Loader from './components/Loader'
import ColumnsWrapper from './components/ColumnsWrapper'
import Section from './components/Section'
import StatusMessage from './components/StatusMessage'
import { fetchWithTimeout } from './lib/fetchWithTimeout'
import { MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import StepLayout from './components/StepLayout'
import StepNav from './components/StepNav'
import { Pen, Brain, Calendar, CheckCircle } from 'lucide-react'

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

const steps = [
  { id: 'contexte', label: 'Saisie & contexte', icon: <Pen className="w-5 h-5" /> },
  { id: 'estimation', label: 'Estimation IA', icon: <Brain className="w-5 h-5" /> },
  { id: 'timeline', label: 'Livraison', icon: <Calendar className="w-5 h-5" /> },
  { id: 'conclusion', label: 'Conclusion', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 'feedback', label: 'Feedback', icon: <MessageCircle className="w-5 h-5" /> },
];

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
  // Pour le bouton scroll to top
  const [showScrollTop, setShowScrollTop] = useState(false)
  // Pour la connexion Notion
  const [notionConnected, setNotionConnected] = useState(false)
  const [notionDatabaseId, setNotionDatabaseId] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  // Ajout de l'état global statusMessage
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null)
  const [thumbVoted, setThumbVoted] = useState<'up' | 'down' | null>(null)
  const [priority, setPriority] = useState<string>('Moyenne')
  const [dependencies, setDependencies] = useState<string[]>([])
  const [dependencyInput, setDependencyInput] = useState('')
  const [hasSavedProject, setHasSavedProject] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    const project = {
      feature,
      capacity,
      startDate,
      integrationLevel,
      dataConcern,
      tasks,
      priority,
      dependencies,
    };
    localStorage.setItem('lastProject', JSON.stringify(project));
  }, [feature, capacity, startDate, integrationLevel, dataConcern, tasks, priority, dependencies]);

  // Vérifie la présence d'un projet sauvegardé au mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasSavedProject(!!localStorage.getItem('lastProject'));
    }
  }, []);

  const handleRestoreProject = () => {
    const saved = localStorage.getItem('lastProject');
    if (!saved) return;
    try {
      const project = JSON.parse(saved);
      setFeature(project.feature || "");
      setCapacity(project.capacity || 1);
      setStartDate(project.startDate || "");
      setIntegrationLevel(project.integrationLevel || "");
      setDataConcern(project.dataConcern || []);
      setTasks(project.tasks || []);
      setPriority(project.priority || 'Moyenne');
      setDependencies(project.dependencies || []);
      setStatusMessage({ type: 'success', message: 'Dernier projet rechargé avec succès.' });
    } catch {
      setStatusMessage({ type: 'error', message: 'Erreur lors du rechargement du projet.' });
    }
  };

  const handleScanCodebase = async () => {
    setIsScanning(true)
    setCodebaseStructure(null)
    setError(null)
    try {
      const res = await fetchWithTimeout('/api/scan-codebase', {}, 15000)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setIsScanning(false)
        return
      }
      setCodebaseStructure(data.structure)
      setIsScanning(false)
    } catch (err: any) {
      setError(err.message)
      setIsScanning(false)
    }
  }

  const handleSubmit = async () => {
    setResult("Analyse en cours...")
    setShowAdvanced(false)
    setError(null)
    setStatusMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const response = await fetchWithTimeout("/api/estimate", {
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
          priority,
          dependencies,
        })
      }, 15000)
      const data = await response.json()
      if (data.error) {
        setError(data.error)
        setResult("")
        setStatusMessage({
          type: 'error',
          message: "Une erreur est survenue lors de l'analyse.",
          actionLabel: "Relancer l'analyse",
          onAction: handleSubmit
        })
        return
      }
      setResult(data.output)
      setStatusMessage({ type: 'success', message: "Estimation complétée avec succès ✅" })
    } catch (err: any) {
      setError(err.message)
      setResult("")
      setStatusMessage({
        type: 'error',
        message: err.message === 'timeout' ? "Le serveur met trop de temps à répondre. Veuillez réessayer." : "Une erreur est survenue lors de l'analyse.",
        actionLabel: "Relancer l'analyse",
        onAction: handleSubmit
      })
    }
  }

  // Pour garantir le même affichage après estimation depuis n'importe quel bouton
  const handleValidateAndEstimate = () => {
    handleSubmit();
    setIsEditingTasks(false);
  };

  // Suggestion de tâches via API
  const handleSuggestTasks = async () => {
    setIsSuggesting(true)
    setSuggestedTasks(null)
    setIsEditingTasks(false)
    try {
      const response = await fetchWithTimeout("/api/suggest-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature })
      }, 15000)
      const data = await response.json()
      setSuggestedTasks(data.tasks)
      setTasks(data.tasks)
      setIsSuggesting(false)
      setIsEditingTasks(true)
    } catch (err: any) {
      setError(err.message)
      setIsSuggesting(false)
    }
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
        const res = await fetchWithTimeout(`/api/github/issues?owner=${encodeURIComponent(githubOwner)}&repo=${encodeURIComponent(githubRepo)}`, {}, 15000)
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
    const res = await fetchWithTimeout('/api/feedback', {}, 15000)
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
      const res = await fetchWithTimeout('/api/feedback', {}, 15000)
      const data = await res.json()
      if (data.feedbacks) {
        setFeedbackHistory(data.feedbacks.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      }
    })()
  }, [feedbackSuccess])

  const handleNotionConnect = async () => {
    window.location.href = '/api/notion/oauth/start'
  }

  const handleExportToNotion = async () => {
    if (!notionConnected) return
    setIsExporting(true)
    setStatusMessage(null)
    try {
      const response = await fetchWithTimeout('/api/notion/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature,
          tasks,
          result,
          startDate,
          databaseId: notionDatabaseId
        })
      }, 15000)
      const data = await response.json()
      if (data.error) {
        setError(data.error)
        setStatusMessage({ type: 'error', message: "Erreur lors de l'export vers Notion." })
      } else {
        setStatusMessage({ type: 'success', message: "Estimation exportée vers Notion avec succès." })
        alert('Estimation exportée vers Notion avec succès !')
      }
    } catch (err) {
      setError('Erreur lors de l\'export vers Notion')
      setStatusMessage({ type: 'error', message: "Erreur lors de l'export vers Notion." })
    }
    setIsExporting(false)
  }

  // Fonction de reset global
  const handleReset = () => {
    if (!window.confirm('Êtes-vous sûr de vouloir tout réinitialiser ?')) return;
    setFeature("");
    setResult("");
    setCapacity(1);
    setIntegrationLevel("");
    setDataConcern([]);
    setStartDate("");
    setShowAdvanced(false);
    setShowAdvancedFields(false);
    setSuggestedTasks(null);
    setTasks([]);
    setIsSuggesting(false);
    setIsEditingTasks(false);
    setCodebaseStructure(null);
    setIsScanning(false);
    setGithubConnected(false);
    setGithubVelocity(null);
    setGithubIssues([]);
    setGithubOwner(process.env.NEXT_PUBLIC_GITHUB_OWNER || '');
    setGithubRepo(process.env.NEXT_PUBLIC_GITHUB_REPO || '');
    setShowCapacity(false);
    setTeam([]);
    setShowFeedback(false);
    setFeedbackEstimation("");
    setFeedbackReal("");
    setFeedbackComment("");
    setFeedbackSuccess(false);
    setFeedbackHistory([]);
    setNotionConnected(false);
    setNotionDatabaseId("");
    setIsExporting(false);
    setError(null);
    setStatusMessage({ type: 'info', message: 'Formulaire réinitialisé.' });
  };

  const handleThumb = async (thumb: 'up' | 'down') => {
    if (thumbVoted) return;
    await fetch('/api/feedback/thumbs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thumb }),
    });
    setThumbVoted(thumb);
    setStatusMessage({ type: 'success', message: 'Merci pour votre retour !' });
  };

  return (
    <main className="flex flex-col items-center bg-gray-50 w-full min-h-screen">
      {/* StepNav : sticky top sur mobile, fixed sur desktop */}
      <StepNav steps={steps} />
      <h1 className="text-4xl font-extrabold mb-12 text-blue-800 w-full text-center">💡 Estimation par IA</h1>

      <ColumnsWrapper>
        <StepLayout id="contexte" title="Saisie & contexte" icon={<Pen className="w-6 h-6 text-blue-500" />}>
          <div className="w-full flex flex-col gap-6 md:gap-8 mb-8">
            {/* Etape 1 : Découpage en tâches techniques */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">1</span>
                <span className="text-lg font-bold text-blue-900">Découper la fonctionnalité en tâches techniques</span>
              </div>
              {hasSavedProject && (
                <div className="mb-4 mt-2 flex flex-col items-start">
                  <button
                    className="mt-2 mb-4 text-sm rounded shadow-sm bg-yellow-400 text-yellow-900 font-semibold px-4 py-2 hover:bg-yellow-500 transition"
                    onClick={handleRestoreProject}
                  >
                    Recharger le dernier projet
                  </button>
                  <span className="text-xs text-yellow-800">Dernier projet sauvegardé localement</span>
                </div>
              )}
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
                </div>
              )}
            </div>
            {/* Etape 2 : Date de démarrage */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">2</span>
                <span className="text-lg font-bold text-blue-900">Date de démarrage</span>
              </div>
              <label className="block font-semibold mt-2 text-gray-900">📅 Date de démarrage</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded mb-2 text-gray-900"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {/* Etape 3 : Champs avancés (facultatif) */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">3</span>
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
                <Fragment>
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
                  <label className="block font-semibold mt-2 text-blue-700">Priorité de la fonctionnalité</label>
                  <select
                    className="mb-4 text-sm rounded-md border border-gray-300 px-3 py-2 w-full"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                  <label className="block font-semibold mt-2 text-blue-700">Dépendances techniques (facultatif)</label>
                  <div className="mb-4">
                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full mb-2"
                      placeholder="Ajouter une dépendance puis Entrée (ex : authentification, API externe...)"
                      value={dependencyInput}
                      onChange={e => setDependencyInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && dependencyInput.trim()) {
                          e.preventDefault();
                          if (!dependencies.includes(dependencyInput.trim())) {
                            setDependencies([...dependencies, dependencyInput.trim()]);
                          }
                          setDependencyInput('');
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {dependencies.map((dep, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm inline-flex items-center">
                          {dep}
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-red-500"
                            onClick={() => setDependencies(dependencies.filter((_, i) => i !== idx))}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </Fragment>
              )}
            </div>
            {/* Etape 4 : Connexion GitHub (facultatif) */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">4</span>
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
            {/* Etape 5 : Connexion Notion (facultatif) */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">5</span>
                <span className="text-lg font-bold text-blue-900">Connexion Notion <span className='text-xs text-blue-500'>(facultatif)</span></span>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">ID de la base Notion</label>
                  <input
                    className="w-full p-2 border border-gray-300 rounded text-gray-900"
                    value={notionDatabaseId}
                    onChange={e => setNotionDatabaseId(e.target.value)}
                    placeholder="ex: 1234567890abcdef"
                  />
                </div>
              </div>
              <div className="mt-2">
                {!notionConnected ? (
                  <button
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    onClick={handleNotionConnect}
                  >
                    Connecter Notion
                  </button>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded p-2 mt-2">
                    <span className="font-bold text-purple-800">Connecté à Notion ✅</span>
                    <span className="text-xs text-gray-700 ml-2">Base : <b>{notionDatabaseId}</b></span>
                  </div>
                )}
              </div>
            </div>
            {/* Etape 6 : Analyse du code existant (facultatif) */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">6</span>
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
            {/* Etape 7 : Capacité équipe */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">7</span>
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
            {/* Etape 8 */}
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-blue-50 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold relative z-10">8</span>
                <span className="text-lg font-bold text-blue-900">Valider et estimer</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
              >
                Estimer
              </button>
            </div>
          </div>
        </StepLayout>

        <StepLayout id="estimation" title="Estimation IA" icon={<Brain className="w-6 h-6 text-purple-500" />}>
          {statusMessage && (
            <StatusMessage
              type={statusMessage.type}
              message={statusMessage.message}
              onClose={() => setStatusMessage(null)}
              actionLabel={statusMessage.actionLabel}
              onAction={statusMessage.onAction}
            />
          )}
          {/* Bloc 1 : Intro IA */}
          {(() => {
            // Extraire l'intro jusqu'à "Voici une décomposition possible :"
            let intro = '';
            let afterIntro = result;
            if (result) {
              const introMatch = result.match(/([\s\S]*?Voici une décomposition possible ?[:：])/i);
              if (introMatch) {
                intro = introMatch[0].trim();
                afterIntro = result.slice(intro.length).trim();
              }
            }
            return (
              <div className="bg-blue-100 rounded-lg p-6 mb-4">
                <h2 className="text-xl font-bold text-blue-900 mb-2">Analyse IA</h2>
                <div className="text-gray-900 whitespace-pre-line leading-relaxed">{intro}</div>
              </div>
            );
          })()}

          {/* Bloc 2 : Tâches techniques (tableau bleu) */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-between mb-4 overflow-y-auto max-h-[420px]">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Tâches techniques</h2>
            {result === "Analyse en cours..." ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader />
              </div>
            ) : (
              (() => {
                // Extraction robuste des tâches techniques et estimations depuis le texte IA
                const taskLines = (result.match(/\d+\.\s.*?:\s*\d+\s*jours?/g) || result.match(/-.*?:\s*\d+\s*jours?/g) || []);
                if (taskLines.length > 0) {
                  return (
                    <>
                      <table className="w-full text-left border-collapse mb-6">
                        <thead>
                          <tr className="border-b border-blue-200">
                            <th className="py-2 px-3 font-bold text-blue-800 text-lg w-3/4">Tâches</th>
                            <th className="py-2 px-3 font-bold text-blue-800 text-lg w-1/4">Estimation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taskLines.map((l, idx) => {
                            const match = l.match(/^(?:\d+\.|-)\s*(.*?)\s*:\s*(\d+\s*jours?)/);
                            const nomTache = match ? match[1].trim() : l;
                            const estimation = match ? match[2] : '—';
                            return (
                              <tr key={idx} className="border-b border-blue-100">
                                <td className="py-2 px-3 align-top text-gray-900">{nomTache}</td>
                                <td className="py-2 px-3 align-top font-bold text-blue-800">{estimation}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {/* Total estimé en gras */}
                      {(() => {
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
                    </>
                  );
                } else {
                  // Fallback : afficher la liste validée par l'utilisateur (tasks) avec estimation vide
                  return (
                    <table className="w-full text-left border-collapse mb-6">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="py-2 px-3 font-bold text-blue-800 text-lg w-3/4">Tâches</th>
                          <th className="py-2 px-3 font-bold text-blue-800 text-lg w-1/4">Estimation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task, idx) => (
                          <tr key={idx} className="border-b border-blue-100">
                            <td className="py-2 px-3 align-top text-gray-900">{task}</td>
                            <td className="py-2 px-3 align-top font-bold text-blue-800">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                }
              })()
            )}
          </div>
        </StepLayout>

        <StepLayout id="timeline" title="Livraison" icon={<Calendar className="w-6 h-6 text-green-600" />}>
          <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-700">
            {startDate && deliveryDate ? (
              <>
                <span className="flex items-center gap-1"><span role="img" aria-label="date">📅</span> {startDate}</span>
                <span className="hidden sm:inline">──▶</span>
                <span className="inline sm:hidden">↓</span>
                <span className="flex items-center gap-1">{deliveryDate}</span>
                <span className="text-gray-400">—</span>
                <span>Durée : {extractTotalDays(result)} jours</span>
              </>
            ) : (
              <span className="text-gray-400">Timeline (à venir)</span>
            )}
          </div>
          {/* Bloc 3 : Date de livraison estimée (bloc vert) */}
          {(() => {
            let dateLivraison: string | null = null;
            const dateMatches = Array.from(result.matchAll(/\d{2}\/\d{2}\/\d{4}/g));
            if (dateMatches.length > 0) {
              dateLivraison = dateMatches[dateMatches.length - 1][0];
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
        </StepLayout>

        <StepLayout id="conclusion" title="Conclusion" icon={<CheckCircle className="w-6 h-6 text-green-500" />}>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Conclusion</h2>
          {(() => {
            // Retirer l'intro et la liste des tâches du texte de conclusion
            let conclusion = result || '';
            // Retirer l'intro jusqu'à "Voici une décomposition possible :"
            conclusion = conclusion.replace(/[\s\S]*?Voici une décomposition possible ?[:：]/i, '');
            // Retirer la liste des tâches techniques (lignes "1. ... : X jours" ou "- ... : X jours")
            conclusion = conclusion.replace(/(\d+\.\s.*?:\s*\d+\s*jours?\s*\n?)+/g, '');
            conclusion = conclusion.replace(/(-\s.*?:\s*\d+\s*jours?\s*\n?)+/g, '');
            // Supprimer aussi toute liste numérotée de tâches sans estimation (ex: 1. ...\n2. ...)
            conclusion = conclusion.replace(/(\d+\.\s.*?\n)+/g, '');
            // Nettoyer les retours à la ligne multiples
            conclusion = conclusion.replace(/[\n\r]{2,}/g, '\n\n').trim();
            // Supprimer "Cependant" si c'est la première phrase ou après un saut de ligne
            conclusion = conclusion.replace(/^(\s*)Cependant[,\.\s]+/i, '$1');
            conclusion = conclusion.replace(/([\n\r]+)Cependant[,\.\s]+/gi, '$1');
            // Mise en forme
            conclusion = conclusion.replace(/(\d{2}\/\d{2}\/\d{4})/g, '<b class="font-bold">$1</b>');
            conclusion = conclusion.replace(/(\d+\s*jours?)/gi, '<b class="font-bold">$1</b>');
            return conclusion ? (
              <div className="text-gray-900 whitespace-pre-line leading-relaxed space-y-6" dangerouslySetInnerHTML={{ __html: conclusion }} />
            ) : null;
          })()}
          {/* Export PDF de la conclusion */}
          {result && (
            <div className="mb-4">
              <PDFDownloadLink
                document={<ConclusionPDF
                  conclusionText={(() => {
                    let resume = result
                      ? result
                        .replace(/Livraison estimée\s*:\s*\d{2}\/\d{2}\/\d{4}/gi, "")
                        .replace(/\d+\.\s.*?:\s*\d+\s*jours?/g, "")
                        .replace(/-\s.*?:\s*\d+\s*jours?/g, "")
                        .replace(/\|.*\|/g, "")
                        .replace(/Calculs secondaires[\s\S]*/i, "")
                        .replace(/Total\s*:\s*\d+\s*jours? de travail|Estimation totale\s*:?-?\s*\d+\s*jours? de travail/i, "")
                        .replace(/[\n\r]{2,}/g, '\n\n')
                        .trim()
                      : '';
                    return resume;
                  })()}
                  advancedSection={advancedSection}
                />}
                fileName="conclusion.pdf"
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-900 flex items-center gap-2"
                onClick={() => setStatusMessage({ type: 'info', message: 'Téléchargement du PDF lancé.' })}
              >
                {({ loading }) => loading ? 'Génération PDF...' : '📄 Exporter la conclusion en PDF'}
              </PDFDownloadLink>
            </div>
          )}
          {/* Affichage des calculs secondaires ou infos avancées si présentes */}
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
        </StepLayout>

        <StepLayout id="feedback" title="Feedback utilisateur" icon={<MessageCircle className="w-6 h-6 text-yellow-500" />}>
          <div className="pb-6 mb-6 border-b border-gray-200">
            <div className="mb-4 text-gray-700 text-sm">Vos retours aident l'IA à mieux estimer vos futures fonctionnalités.</div>
            <button
              className="flex items-center gap-2 bg-yellow-400 text-yellow-900 font-semibold px-4 py-2 rounded-md shadow hover:bg-yellow-500 transition mb-4"
              onClick={() => setShowFeedback(true)}
            >
              <MessageCircle className="w-5 h-5" />
              Saisir le feedback post-livraison
            </button>
            {showFeedback && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsExporting(true);
                  try {
                    await handleSendFeedback();
                  } finally {
                    setIsExporting(false);
                  }
                }}
                className="mb-4"
              >
                <textarea
                  className="w-full rounded-md border border-gray-300 p-3 text-sm mb-2"
                  placeholder="Votre retour nous aide à améliorer l'estimation…"
                  value={feedbackComment}
                  onChange={e => setFeedbackComment(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                    disabled={isExporting}
                  >
                    {isExporting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                    Envoyer
                  </button>
                  {/* Toggle rapide 👍 / 👎 */}
                  <button type="button" className={`p-2 rounded hover:bg-gray-100 ${thumbVoted === 'up' ? 'bg-green-100' : ''}`} title="Estimation utile" onClick={() => handleThumb('up')} disabled={!!thumbVoted}><ThumbsUp className="w-5 h-5 text-green-600" /></button>
                  <button type="button" className={`p-2 rounded hover:bg-gray-100 ${thumbVoted === 'down' ? 'bg-red-100' : ''}`} title="Estimation peu utile" onClick={() => handleThumb('down')} disabled={!!thumbVoted}><ThumbsDown className="w-5 h-5 text-red-600" /></button>
                </div>
                {/* StatusMessage pour feedback */}
                {statusMessage && (
                  <StatusMessage
                    type={statusMessage.type}
                    message={statusMessage.message}
                    onClose={() => setStatusMessage(null)}
                    timeout={statusMessage.type === 'success' ? 4000 : undefined}
                  />
                )}
              </form>
            )}
          </div>
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
        </StepLayout>
      </ColumnsWrapper>

      {/* Bouton flottant scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 bg-blue-700 text-white rounded-full shadow-lg p-3 hover:bg-blue-900 transition-all"
          aria-label="Remonter en haut de page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Bouton sticky en bas de la page (hors <main>) */}
      <button
        onClick={handleReset}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-200 text-gray-700 px-6 py-3 rounded-full shadow-lg font-semibold hover:bg-gray-300 transition"
      >
        Réinitialiser
      </button>
    </main>
  )
}
