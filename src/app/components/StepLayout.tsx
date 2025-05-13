import React from 'react';

interface StepLayoutProps {
  title: string;
  id: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function StepLayout({ title, id, icon, children }: StepLayoutProps) {
  return (
    <section id={id} className="rounded-xl shadow bg-white border p-6 space-y-4 scroll-mt-24">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
} 