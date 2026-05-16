import type { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';

export function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_28%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eef8f7_38%,_#f8fafc_100%)]">
       <Toaster
        position="top-right"
        toastOptions={{
          duration: 2800,
          style: {
            borderRadius: '0.75rem',
            background: '#0f172a',
            color: '#f8fafc',
          },
        }}
      />
      <div className="flex min-h-screen items-stretch">
        {children}
      </div>
    </main>
  );
}
