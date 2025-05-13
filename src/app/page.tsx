"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import StepLayout from "./components/StepLayout";
import StepNav from "./components/StepNav";
import { FaRegFileAlt, FaRegListAlt, FaRegCalendarAlt, FaRegCheckCircle, FaRegCommentDots, FaRegFolderOpen } from "react-icons/fa";

const steps = [
  { id: "saisie", title: "Saisie & contexte", icon: <FaRegFileAlt /> },
  { id: "decoupage", title: "Découpage & estimation", icon: <FaRegListAlt /> },
  { id: "livraison", title: "Livraison & scoring", icon: <FaRegCalendarAlt /> },
  { id: "resultat", title: "Résultat", icon: <FaRegCheckCircle /> },
  { id: "feedback", title: "Feedback", icon: <FaRegCommentDots /> },
  { id: "exports", title: "Exports", icon: <FaRegFolderOpen /> },
];

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
  const [velocitySource, setVelocitySource] = useState<string>("github");
  const [velocityData, setVelocityData] = useState<any>(null);
  const [velocityLoading, setVelocityLoading] = useState(false);
  const [velocityError, setVelocityError] = useState<string | null>(null);
  const [teamCapacity, setTeamCapacity] = useState(100); // en %
  const [teamAbsences, setTeamAbsences] = useState(0); // en jours
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [estimationPeriod, setEstimationPeriod] = useState(10); // jours ouvrés par défaut (à ajuster dynamiquement plus tard)
  const [tendance, setTendance] = useState<string | null>(null);
  const [correctionPct, setCorrectionPct] = useState<number | null>(null);
  const [totalEstimation, setTotalEstimation] = useState<number | null>(null);
  const [correctedEstimation, setCorrectedEstimation] = useState<number | null>(null);
  const [dependencies, setDependencies] = useState<{ name: string; level: string }[]>([]);
  const [depName, setDepName] = useState("");
  const [depLevel, setDepLevel] = useState("critique");
  const [risks, setRisks] = useState("");
  const [scoreDetails, setScoreDetails] = useState<any>(null);

  // Calcul capacité réelle (simple)
  const workingDays = estimationPeriod - (excludeWeekends ? Math.floor(estimationPeriod / 7) * 2 : 0); // approximation
  const realCapacity = Math.max(0, Math.round((workingDays * (teamCapacity / 100)) - teamAbsences));

  useEffect(() => {
    async function fetchVelocity() {
      setVelocityData(null);
      setVelocityError(null);
      if (velocitySource === "github") {
        setVelocityLoading(true);
        try {
          const res = await fetch("/api/github/velocity");
          const data = await res.json();
          if (res.ok) {
            setVelocityData({
              summary: `${data.avgPerWeek.toFixed(2)} tickets/semaine, ${data.avgDuration.toFixed(1)} jours/ticket (sur ${data.weeksAnalyzed} sem., ${data.totalClosed} tickets)`
            });
          } else {
            setVelocityError(data.error || "Erreur lors de la récupération de la vélocité GitHub.");
          }
        } catch (e) {
          setVelocityError("Erreur lors de la récupération de la vélocité GitHub.");
        }
        setVelocityLoading(false);
      } else if (velocitySource === "trello") {
        setVelocityLoading(true);
        try {
          const res = await fetch("/api/trello/velocity");
          const data = await res.json();
          if (res.ok) {
            setVelocityData({
              summary: `${data.avgPerWeek.toFixed(2)} cartes/semaine, ${data.avgDuration.toFixed(1)} jours/carte (sur ${data.weeksAnalyzed} sem., ${data.totalClosed} cartes)`
            });
          } else {
            setVelocityError(data.error || "Erreur lors de la récupération de la vélocité Trello.");
          }
        } catch (e) {
          setVelocityError("Erreur lors de la récupération de la vélocité Trello.");
        }
        setVelocityLoading(false);
      } else if (velocitySource === "jira") {
        setVelocityData(null);
        setVelocityError("(À connecter à l'API JIRA)");
      } else if (velocitySource === "notion") {
        setVelocityData(null);
        setVelocityError("(À connecter à l'API Notion)");
      }
    }
    fetchVelocity();
  }, [velocitySource]);

  const handleAnalyze = async () => {
    if (!feature) return;
    setIsLoading(true);
    setResult("");
    setTasks([]);
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          velocitySource,
          velocityData,
          teamCapacity,
          teamAbsences,
          excludeWeekends,
          realCapacity,
          estimationPeriod,
          dependencies,
          risks,
        })
      });
      const data = await res.json();
      setResult(data.output || "");
      setConfidenceScore(typeof data.confidenceScore === 'number' ? data.confidenceScore : null);
      setTendance(data.tendance || null);
      setCorrectionPct(typeof data.correctionPct === 'number' ? data.correctionPct : null);
      setTotalEstimation(typeof data.totalEstimation === 'number' ? data.totalEstimation : null);
      setCorrectedEstimation(typeof data.correctedEstimation === 'number' ? data.correctedEstimation : null);
      setScoreDetails(data.scoreDetails || null);
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

  const handleExportPDF = () => {
    if (!tasks.length) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Estimation IA - Tâches techniques", 10, 15);
    doc.setFontSize(12);
    let y = 30;
    tasks.forEach((t, i) => {
      doc.text(`${i + 1}. ${t.name} : ${t.days > 0 ? t.days + ' jours' : '-'}`, 10, y);
      y += 8;
    });
    doc.text(`Total : ${tasks.reduce((sum, t) => sum + (t.days || 0), 0)} jours`, 10, y + 5);
    doc.save("estimation.pdf");
    setExportStatus('Export PDF téléchargé ✅');
    setTimeout(() => setExportStatus(''), 3000);
  };

  return (
    <div className="relative">
      <StepNav steps={steps} />
      <main className="max-w-screen-lg mx-auto px-6 py-10 space-y-12">
        <StepLayout id="saisie" title="🧾 Saisie & contexte" icon={<FaRegFileAlt />}>
          {/* Saisie & contexte : description, date, capacité, vélocité, dépendances, risques, bouton analyser */}
          {/* ... déplacer ici le contenu du bloc Saisie & contexte ... */}
        </StepLayout>
        <StepLayout id="decoupage" title="🔍 Découpage & estimation" icon={<FaRegListAlt />}>
          {/* Découpage & estimation : tableau tâches, total, buffer, pondération IA */}
          {/* ... déplacer ici le contenu du bloc Découpage & estimation ... */}
        </StepLayout>
        <StepLayout id="livraison" title="📆 Livraison & scoring" icon={<FaRegCalendarAlt />}>
          {/* Livraison & scoring : date, score de confiance, détails */}
          {/* ... déplacer ici le contenu du bloc Livraison & scoring ... */}
        </StepLayout>
        <StepLayout id="resultat" title="📄 Résultat / conclusion" icon={<FaRegCheckCircle />}>
          {/* Résultat : texte généré, correctif IA, export PDF */}
          {/* ... déplacer ici le contenu du bloc Résultat ... */}
        </StepLayout>
        <StepLayout id="feedback" title="💬 Feedback & historique" icon={<FaRegCommentDots />}>
          {/* Feedback : NPS, commentaire, historique */}
          {/* ... déplacer ici le contenu du bloc Feedback ... */}
        </StepLayout>
        <StepLayout id="exports" title="🗂️ Exports" icon={<FaRegFolderOpen />}>
          {/* Exports : ExportCenter, boutons exports */}
          {/* ... déplacer ici le contenu du bloc Exports ... */}
        </StepLayout>
      </main>
    </div>
  );
}
