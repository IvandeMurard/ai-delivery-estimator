import { ReactNode } from 'react';

interface StepLayoutProps {
  title: string;
  icon?: ReactNode;
  id?: string;
  children: ReactNode;
}

export default function StepLayout({ title, icon, id, children }: StepLayoutProps) {
  return (
    <section id={id} className="w-full max-w-screen-md mx-auto bg-white p-6 rounded-xl shadow-sm border space-y-4 scroll-mt-24">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
} 