"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 bg-background/50 backdrop-blur sticky top-0 z-10">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6 bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
