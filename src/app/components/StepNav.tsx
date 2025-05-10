import { useEffect, useState } from 'react';

interface Step {
  id: string;
  label: string;
  icon?: JSX.Element;
}

interface StepNavProps {
  steps: Step[];
}

export default function StepNav({ steps }: StepNavProps) {
  const [activeId, setActiveId] = useState<string>(steps[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      let found = steps[0]?.id || '';
      for (const step of steps) {
        const el = document.getElementById(step.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight / 2) {
            found = step.id;
          }
        }
      }
      setActiveId(found);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [steps]);

  const scrollToStep = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className="hidden xl:block fixed top-6 left-6 z-40 bg-white/90 rounded-xl shadow-sm px-4 py-6 text-sm font-medium space-y-3 max-w-[220px]"
      aria-label="Navigation des étapes"
    >
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => scrollToStep(step.id)}
          className={
            'flex items-center gap-2 w-full text-left px-2 py-2 transition-colors rounded ' +
            (activeId === step.id ? 'bg-gray-100 text-blue-900 font-semibold' : 'hover:bg-gray-50 text-gray-700')
          }
          aria-current={activeId === step.id ? 'step' : undefined}
        >
          {step.icon && <span className="w-5 h-5 text-blue-500">{step.icon}</span>}
          <span>{step.label}</span>
        </button>
      ))}
    </nav>
  );
} 