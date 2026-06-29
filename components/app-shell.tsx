"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, Leaf, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/processos", label: "Processos", icon: FolderKanban },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Leaf className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Comunique-se</p>
            <p className="text-xs text-sidebar-foreground/60">
              Licenciamento Ambiental
            </p>
          </div>
        </div>

        <nav className="flex gap-1 px-3 pb-4 lg:flex-col lg:gap-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto hidden p-3 lg:block">
          <Link
            href="/processos"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors hover:bg-green-200 hover:text-green-900"
          >
            Processos
          </Link>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1700px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
