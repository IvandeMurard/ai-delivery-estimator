import { ReactNode } from 'react';

export default function ColumnsWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full px-6 lg:px-12 xl:px-20 grid grid-cols-1 xl:grid-cols-4 gap-x-8 gap-y-8">
      {children}
    </div>
  );
} 