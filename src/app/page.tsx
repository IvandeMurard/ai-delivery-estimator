"use client";

export default function Home() {
  return (
    <main className="flex flex-col items-center bg-gray-50 w-full min-h-screen">
      {/* StepNav : sticky top sur mobile, fixed sur desktop */}
      {/* <StepNav steps={steps} /> */}
      <h1 className="text-4xl font-extrabold mb-4 text-blue-800 w-full text-center">💡 Estimation par IA</h1>

      <div className="w-full max-w-screen-md mx-auto">
        <section className="bg-white rounded-lg p-6 shadow-sm border border-blue-50 mb-8">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            {/* <Pen className="w-6 h-6 text-blue-500" /> */}
            Saisie & contexte
          </h2>
          <div className="w-full flex flex-col gap-6 md:gap-8 mb-8">
            <div className="flex flex-col relative z-0 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <label htmlFor="feature" className="font-medium mb-2">Décris la fonctionnalité à estimer</label>
              <textarea id="feature" className="border rounded p-2 min-h-[80px]" placeholder="Ex : Permettre à l'utilisateur de ..." />
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded opacity-50 cursor-not-allowed" disabled>Analyser avec l'IA</button>
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
                <li>Exemple de tâche 1</li>
                <li>Exemple de tâche 2</li>
              </ul>
            </div>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded opacity-50 cursor-not-allowed" disabled>Générer estimation</button>
          </div>
        </section>
      </div>
    </main>
  );
}
