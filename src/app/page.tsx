'use client'

import { useState, useRef } from "react"

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
  const [dataConcern, setDataConcern] = useState("")
  const [startDate, setStartDate] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAdvancedFields, setShowAdvancedFields] = useState(false)
  const capacityInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setResult("Analyse en cours...")
    setShowAdvanced(false)

    const response = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature,
        capacity,
        dataConcern,
        integrationLevel,
        startDate,
      })
    })

    const data = await response.json()
    setResult(data.output)
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
            <select
              className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-900"
              value={dataConcern}
              onChange={(e) => setDataConcern(e.target.value)}
            >
              <option value="">-- Sélectionner --</option>
              <option value="Aucune problématique de données">Aucune problématique</option>
              <option value="Données à migrer ou à nettoyer">Migration/nettoyage de données</option>
              <option value="Connexion à des sources de données externes">Connexion à des sources externes</option>
              <option value="Respect de la RGPD ou contraintes légales">Contraintes légales (RGPD, etc.)</option>
            </select>
          </>
        )}

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full"
        >
          Estimer
        </button>
      </section>

      {result && (
        <section className="w-full max-w-xl bg-white p-6 rounded shadow mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Résumé de l'estimation</h2>

          {deliveryDate && (
            <div className="text-lg font-semibold text-green-700 mb-4">
              📆 Livraison estimée : {deliveryDate}
            </div>
          )}

          <div className="mb-4 border-b border-gray-200"></div>

          <pre className="whitespace-pre-wrap text-gray-900">
            {result && result.replace(/Livraison estimée\s*:\s*\d{2}\/\d{2}\/\d{4}/i, "").replace(/Calculs secondaires[\s\S]*/i, "")}
          </pre>

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
