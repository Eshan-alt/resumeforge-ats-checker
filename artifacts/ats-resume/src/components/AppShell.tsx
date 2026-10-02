import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useGetAccount } from "@workspace/api-client-react";
import {
  Briefcase,
  LayoutDashboard,
  FileSearch,
  FileText,
  History,
  ShieldCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: account } = useGetAccount();
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/analyze", label: "ATS checker", icon: FileSearch },
    { href: "/resumes", label: "My resumes", icon: FileText },
    { href: "/history", label: "Analysis history", icon: History },
    { href: "/account", label: "Account", icon: Settings },
    ...(account?.role === "admin"
      ? [{ href: "/admin", label: "Administration", icon: ShieldCheck }]
      : []),
  ];
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4"
      >
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-18 items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <span className="rounded-xl bg-primary p-2.5 text-primary-foreground">
              <Briefcase size={20} />
            </span>
            <span className="font-semibold tracking-tight text-lg">
              ResumeForge
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-sm text-muted-foreground">
              {user?.firstName || "Your workspace"}
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
        <nav
          aria-label="Workspace"
          className="mx-auto max-w-7xl flex overflow-x-auto gap-1 px-4 sm:px-6 pb-3"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              location === href ||
              (href === "/resumes" && location.startsWith("/resumes/")) ||
              (href === "/history" && location.startsWith("/analyses/"));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div id="workspace-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="no-print mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground border-t mt-8 flex flex-wrap justify-between gap-3">
        <span>ResumeForge · Build a stronger application.</span>
        <span>Scores are guidance. Hiring systems and decisions vary.</span>
      </footer>
    </div>
  );
}
