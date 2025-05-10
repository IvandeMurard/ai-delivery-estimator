import { ReactNode } from 'react';

export default function ColumnsWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-screen-lg mx-auto px-6 py-8 space-y-12">
      {children}
    </div>
  );
} 