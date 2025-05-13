import React, { useEffect, useState } from 'react';

interface Step {
  id: string;
  title: string;
  icon?: React.ReactNode;
}

interface StepNavProps {
  steps: Step[];
}

export default function StepNav({ steps }: StepNavProps) {
  const [activeId, setActiveId] = useState<string>(steps[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const offsets = steps.map(step => {
        const el = document.getElementById(step.id);
        if (!el) return { id: step.id, top: Infinity };
        const rect = el.getBoundingClientRect();
        return { id: step.id, top: Math.abs(rect.top - 100) };
      });
      const closest = offsets.reduce((a, b) => (a.top < b.top ? a : b));
      setActiveId(closest.id);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [steps]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className="hidden md:flex flex-col fixed left-0 top-24 w-56 bg-white shadow rounded-xl p-4 space-y-2 z-30"
      aria-label="Navigation des étapes"
    >
      {steps.map(step => (
        <button
          key={step.id}
          onClick={() => scrollTo(step.id)}
          className={`flex items-center gap-3 px-3 py-2 rounded transition font-medium text-left w-full
            ${activeId === step.id ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' : 'hover:bg-gray-50 text-gray-700'}`}
          aria-current={activeId === step.id ? 'step' : undefined}
        >
          {step.icon && <span className="text-xl">{step.icon}</span>}
          <span>{step.title}</span>
        </button>
      ))}
    </nav>
  );
} 