import { useState } from "react";
import StatusMessage from "./StatusMessage";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { EstimationPDF } from "./EstimationPDF";

interface ExportCenterProps {
  tasks: any[];
  result: string;
  feature: string;
  startDate: string;
  notionDatabaseId?: string;
  trelloListId?: string;
  jiraBaseUrl?: string;
  jiraProjectKey?: string;
}

export default function ExportCenter({ tasks, result, feature, startDate, notionDatabaseId, trelloListId, jiraBaseUrl, jiraProjectKey }: ExportCenterProps) {
  const [status, setStatus] = useState<{ [key: string]: { type: 'success' | 'error', message: string } | null }>({});
  const [isExporting, setIsExporting] = useState<{ [key: string]: boolean }>({});

  // PDF
  const pdfButton = (
    <PDFDownloadLink
      document={<EstimationPDF feature={feature} tasks={tasks} result={result} startDate={startDate} />}
      fileName="estimation.pdf"
      className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center"
    >
      {({ loading }) => loading ? 'Génération PDF...' : '📤 Export PDF'}
    </PDFDownloadLink>
  );

  // Notion
  const handleExportNotion = async () => {
    setIsExporting(e => ({ ...e, notion: true }));
    setStatus(s => ({ ...s, notion: null }));
    try {
      const res = await fetch('/api/notion/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, tasks, result, startDate, databaseId: notionDatabaseId })
      });
      const data = await res.json();
      if (data.error) setStatus(s => ({ ...s, notion: { type: 'error', message: data.error } }));
      else setStatus(s => ({ ...s, notion: { type: 'success', message: 'Export réussi vers Notion ✅' } }));
    } catch {
      setStatus(s => ({ ...s, notion: { type: 'error', message: 'Erreur export Notion' } }));
    }
    setIsExporting(e => ({ ...e, notion: false }));
  };

  // CSV
  const handleExportCSV = () => {
    const csv = [
      ['Tâche', 'Estimation'],
      ...tasks.map((t: any) => [t.name || t, t.duration || t.estimation || ''])
    ].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estimation.csv';
    a.click();
    setStatus(s => ({ ...s, csv: { type: 'success', message: 'Export CSV téléchargé ✅' } }));
    setTimeout(() => setStatus(s => ({ ...s, csv: null })), 3000);
  };

  // Trello
  const handleExportTrello = async () => {
    setIsExporting(e => ({ ...e, trello: true }));
    setStatus(s => ({ ...s, trello: null }));
    try {
      const res = await fetch('/api/trello/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, listId: trelloListId })
      });
      const data = await res.json();
      if (data.success) setStatus(s => ({ ...s, trello: { type: 'success', message: 'Export réussi vers Trello ✅' } }));
      else setStatus(s => ({ ...s, trello: { type: 'error', message: data.error || 'Erreur export Trello' } }));
    } catch {
      setStatus(s => ({ ...s, trello: { type: 'error', message: 'Erreur export Trello' } }));
    }
    setIsExporting(e => ({ ...e, trello: false }));
  };

  // JIRA
  const handleExportJira = async () => {
    setIsExporting(e => ({ ...e, jira: true }));
    setStatus(s => ({ ...s, jira: null }));
    try {
      const res = await fetch('/api/jira/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, jiraBaseUrl, jiraProjectKey })
      });
      const data = await res.json();
      if (data.success) setStatus(s => ({ ...s, jira: { type: 'success', message: 'Export réussi vers JIRA ✅' } }));
      else setStatus(s => ({ ...s, jira: { type: 'error', message: data.error || 'Erreur export JIRA' } }));
    } catch {
      setStatus(s => ({ ...s, jira: { type: 'error', message: 'Erreur export JIRA' } }));
    }
    setIsExporting(e => ({ ...e, jira: false }));
  };

  return (
    <div className="mt-8">
      <div className="text-lg font-bold mb-1">Exports disponibles</div>
      <div className="text-gray-600 text-sm mb-4">Choisissez un ou plusieurs formats pour partager ou synchroniser cette estimation</div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {pdfButton}
        <button
          className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center"
          onClick={handleExportNotion}
          disabled={isExporting.notion}
        >
          🧠 Export vers Notion
        </button>
        <button
          className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center"
          onClick={handleExportCSV}
        >
          📋 Export CSV
        </button>
        <button
          className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center"
          onClick={handleExportTrello}
          disabled={isExporting.trello}
        >
          ✅ Export Trello
        </button>
        <button
          className="bg-white border px-4 py-2 rounded shadow text-sm hover:bg-gray-50 flex items-center gap-2 justify-center"
          onClick={handleExportJira}
          disabled={isExporting.jira}
        >
          🟠 Export JIRA
        </button>
      </div>
      <div className="space-y-2">
        {status.notion && <StatusMessage type={status.notion.type} message={status.notion.message} />}
        {status.csv && <StatusMessage type={status.csv.type} message={status.csv.message} />}
        {status.trello && <StatusMessage type={status.trello.type} message={status.trello.message} />}
        {status.jira && <StatusMessage type={status.jira.type} message={status.jira.message} />}
      </div>
    </div>
  );
} 