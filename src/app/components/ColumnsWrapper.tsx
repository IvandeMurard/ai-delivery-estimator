import { ReactNode } from 'react';

export default function ColumnsWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 py-4 overflow-x-hidden md:grid md:grid-cols-4 md:gap-10 md:px-8">
      {children}
    </div>
  );
} 