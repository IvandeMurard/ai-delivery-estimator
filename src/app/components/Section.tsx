import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export default function Section({ id, title, children }: SectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 pb-6 mb-6 border-b border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      {children}
    </section>
  );
} 