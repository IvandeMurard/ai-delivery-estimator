import React from 'react';

interface StepLayoutProps {
  title: React.ReactNode;
  id: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  stepNumber?: number;
  active?: boolean;
}

export default function StepLayout({ title, id, icon, children, stepNumber, active = true }: StepLayoutProps) {
  return (
    <section
      id={id}
      className={`rounded-xl shadow-sm bg-white border p-6 space-y-4 scroll-mt-24 ${!active ? 'opacity-50 pointer-events-none select-none' : ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {stepNumber !== undefined && (
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-base">
            {stepNumber}
          </span>
        )}
        {icon && <span className="text-2xl text-gray-700">{icon}</span>}
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
} 