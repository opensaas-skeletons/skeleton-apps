import type { ReactNode } from "react";

interface AppLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarCollapsed: boolean;
}

export default function AppLayout({ sidebar, children, sidebarCollapsed }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`shrink-0 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-[280px]"
        }`}
      >
        {sidebar}
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
