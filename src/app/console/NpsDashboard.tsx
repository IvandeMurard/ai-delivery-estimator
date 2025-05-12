"use client";
import { useEffect, useState } from "react";

interface Feedback {
  feature: string;
  npsScore: number;
  date: string;
  comment: string;
}

export default function NpsDashboard() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feedback/stats")
      .then((res) => res.json())
      .then((data) => {
        setFeedbacks(data.feedbacks || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="max-w-screen-md mx-auto py-10">Chargement…</div>;

  // Nombre total
  const total = feedbacks.length;

  // Histogramme (0-10)
  const histo = Array.from({ length: 11 }, (_, i) => feedbacks.filter((f) => f.npsScore === i).length);

  // Group by feature
  const featureMap: Record<string, { sum: number; count: number; nps: number[] }> = {};
  feedbacks.forEach(f => {
    if (!featureMap[f.feature]) featureMap[f.feature] = { sum: 0, count: 0, nps: [] };
    featureMap[f.feature].sum += f.npsScore;
    featureMap[f.feature].count++;
    featureMap[f.feature].nps.push(f.npsScore);
  });
  const featureStats = Object.entries(featureMap)
    .map(([feature, { sum, count, nps }]) => ({ feature, avg: sum / count, count, nps }))
    .sort((a, b) => b.avg - a.avg);

  // Top 5 feedbacks critiques (NPS < 6)
  const lowFeedbacks = feedbacks.filter((f) => f.npsScore < 6).sort((a, b) => a.npsScore - b.npsScore).slice(0, 5);

  // Distribution NPS groupée
  const red = feedbacks.filter((f) => f.npsScore <= 6).length;
  const yellow = feedbacks.filter((f) => f.npsScore === 7 || f.npsScore === 8).length;
  const green = feedbacks.filter((f) => f.npsScore >= 9).length;

  // Derniers feedbacks
  const lastFeedbacks = [...feedbacks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="max-w-screen-md mx-auto py-10 space-y-10">
      {/* Bloc 1 : Moyenne NPS par type de fonctionnalité */}
      <div className="border-b pb-6 mb-6">
        <div className="text-xl font-semibold mb-2">📊 Moyenne NPS par type de fonctionnalité</div>
        <table className="w-full text-sm text-gray-700 mb-4">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Feature</th>
              <th className="text-left p-2">Moyenne NPS</th>
              <th className="text-left p-2">Nb réponses</th>
            </tr>
          </thead>
          <tbody>
            {featureStats.map((f, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2 font-medium">{f.feature}</td>
                <td className="p-2">{f.avg.toFixed(2)}</td>
                <td className="p-2">{f.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="font-bold mb-2 text-red-600">Top 5 feedbacks NPS &lt; 6</div>
        {lowFeedbacks.length === 0 && <div className="text-xs text-gray-500">Aucun feedback critique.</div>}
        <ul className="space-y-2">
          {lowFeedbacks.map((f, idx) => (
            <li key={idx} className="bg-red-50 border-l-4 border-red-400 p-2 rounded">
              <div className="text-sm font-bold text-red-700">{f.npsScore} – {f.feature}</div>
              <div className="text-xs text-gray-500">{new Date(f.date).toLocaleDateString()}</div>
              <div className="text-sm">{f.comment}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bloc 2 : Distribution NPS groupée */}
      <div className="border-b pb-6 mb-6">
        <div className="text-xl font-semibold mb-2">🟢 Distribution NPS groupée</div>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-24">Détracteurs</span>
            <div className="flex-1 h-4 bg-red-200 rounded">
              <div className="h-4 bg-red-500 rounded" style={{ width: `${(red / total) * 100 || 2}%` }}></div>
            </div>
            <span className="ml-2 text-red-700 font-bold">{red}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-24">Passifs</span>
            <div className="flex-1 h-4 bg-yellow-100 rounded">
              <div className="h-4 bg-yellow-400 rounded" style={{ width: `${(yellow / total) * 100 || 2}%` }}></div>
            </div>
            <span className="ml-2 text-yellow-700 font-bold">{yellow}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-24">Promoteurs</span>
            <div className="flex-1 h-4 bg-green-100 rounded">
              <div className="h-4 bg-green-500 rounded" style={{ width: `${(green / total) * 100 || 2}%` }}></div>
            </div>
            <span className="ml-2 text-green-700 font-bold">{green}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">Détracteurs : 0–6 | Passifs : 7–8 | Promoteurs : 9–10</div>
      </div>

      {/* Bloc 3 : Derniers feedbacks reçus */}
      <div className="border-b pb-6 mb-6">
        <div className="text-xl font-semibold mb-2">🕓 Derniers feedbacks reçus</div>
        <ul className="space-y-2">
          {lastFeedbacks.map((f, idx) => (
            <li key={idx} className="bg-gray-50 border-l-4 border-blue-400 p-2 rounded">
              <div className="text-sm font-bold text-blue-700">{f.npsScore} – {f.feature}</div>
              <div className="text-xs text-gray-500">{new Date(f.date).toLocaleDateString()}</div>
              <div className="text-sm">{f.comment}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bloc 4 : Nombre total de réponses & histogramme */}
      <div>
        <div className="text-xl font-semibold mb-2">Nombre total de réponses</div>
        <div className="text-2xl font-bold mb-2">{total}</div>
        <div className="text-xs text-gray-500 mb-1">Histogramme des scores NPS</div>
        <div className="flex items-end gap-1 h-24">
          {histo.map((count, i) => (
            <div key={i} className="flex flex-col items-center justify-end h-full">
              <div
                className={`w-6 rounded-t ${i <= 6 ? 'bg-red-400' : i <= 8 ? 'bg-yellow-300' : 'bg-green-400'}`}
                style={{ height: `${count * 12 || 4}px` }}
                title={`Score ${i}: ${count}`}
              ></div>
              <div className="text-xs text-gray-500 mt-1">{i}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 