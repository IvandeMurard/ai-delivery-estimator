import { ReactNode } from 'react';

const steps = [
  { id: 'saisie-contexte', label: 'Saisie' },
  { id: 'estimation-ia', label: 'Estimation' },
  { id: 'conclusion', label: 'Conclusion' },
  { id: 'feedback', label: 'Feedback' },
];

export default function ColumnsWrapper({ children }: { children: ReactNode }) {
  // Scrollspy/activeStep à gérer côté page (props ou context si besoin)
  return (
    <div className="relative w-full bg-transparent">
      {/* Stepper sticky (vertical sur desktop, horizontal sur mobile) */}
      <nav className="sticky top-6 z-30 mb-8 flex flex-row xl:flex-col gap-4 xl:gap-6 items-center xl:items-start bg-white/80 rounded-xl shadow-sm px-4 py-2 xl:py-6 xl:px-6 max-w-full xl:max-w-[220px] mx-auto xl:mx-0">
        {steps.map((step, idx) => (
          <a
            key={step.id}
            href={`#${step.id}`}
            className={
              'transition-colors px-3 py-2 rounded-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 scroll-smooth ' +
              // Ajoute la classe active dynamiquement côté page (ex: activeStep === step.id)
              '[data-active-step="' + step.id + '"]'
            }
          >
            <span className="inline-block w-6 h-6 mr-2 rounded-full bg-blue-100 text-blue-700 font-bold text-center align-middle">
              {idx + 1}
            </span>
            {step.label}
          </a>
        ))}
      </nav>
      {/* Contenu principal vertical */}
      <div className="flex flex-col gap-y-12 max-w-screen-lg mx-auto px-6 py-12">
        {children}
      </div>
    </div>
  );
} 