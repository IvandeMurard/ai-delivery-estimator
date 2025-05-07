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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const capacityInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    setResult("Analyse en cours...")
    setShowAdvanced(false)

    const response = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature, capacity })
    })

    const data = await response.json()
    setResult(data.output)
  }

  const deliveryDate = extractDeliveryDate(result)
  const advancedSection = extractAdvancedSection(result)

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">💡 Estimation par IA</h1>

      <textarea
        value={feature}
        onChange={(e) => setFeature(e.target.value)}
        placeholder="Décris ta fonctionnalité ici..."
        className="w-full max-w-xl p-4 border border-gray-300 rounded mb-4"
        rows={5}
      />

      <div className="flex gap-2 w-full max-w-xl mb-4">
        <input
          ref={capacityInputRef}
          type="number"
          min={1}
          max={10}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          placeholder="Nombre de développeurs"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          className="bg-gray-200 px-3 rounded text-sm hover:bg-gray-300"
          onClick={() => {
            if (capacityInputRef.current) capacityInputRef.current.focus()
            handleSubmit()
          }}
        >
          Recalculer avec X devs
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mb-2"
      >
        Estimer
      </button>

      {deliveryDate && (
        <div className="text-lg font-semibold text-green-700 mt-4 mb-2">
          📆 Livraison estimée : {deliveryDate}
        </div>
      )}

      <pre className="w-full max-w-xl whitespace-pre-wrap bg-gray-100 p-4 rounded">
        {result && result.replace(/Livraison estimée\s*:\s*\d{2}\/\d{2}\/\d{4}/i, "").replace(/Calculs secondaires[\s\S]*/i, "")}
      </pre>

      {advancedSection && (
        <>
          <button
            className="mt-2 text-blue-600 underline text-sm"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Masquer les infos avancées" : "Afficher plus (calculs secondaires)"}
          </button>
          {showAdvanced && (
            <pre className="w-full max-w-xl whitespace-pre-wrap bg-yellow-50 p-4 rounded mt-2 border border-yellow-200">
              {advancedSection}
            </pre>
          )}
        </>
      )}
    </main>
  )
}
