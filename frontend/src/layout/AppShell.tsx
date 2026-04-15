import { PropsWithChildren } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopNav } from "../components/TopNav";
import { useAuth } from "../context/AuthContext";

export function AppShell({ children }: PropsWithChildren) {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar role={profile.role} />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        <TopNav />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
