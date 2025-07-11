
import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 
        A common header or sidebar for all dashboard pages can be placed here.
        For now, the DashboardHeader is part of dashboard/page.tsx itself.
        This layout can be enhanced later.
      */}
      {children}
    </div>
  );
}
