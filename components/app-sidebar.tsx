"use client"

import * as React from "react"
import { LayoutDashboard, Users, Settings, BarChart3, FileText, Mail, ListChecks, Inbox, UserCheck } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="border-r border-border bg-sidebar">
      <SidebarHeader className="bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            ID
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">Interview Dashboard</span>
            <span className="text-xs text-muted-foreground">v2.0.0</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="bg-sidebar-border" />
      <SidebarContent className="bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/replies">
                <Mail className="h-4 w-4" />
                <span>Replies</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/experts">
                <Users className="h-4 w-4" />
                <span>Experts</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/analytics">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/tasks">
                <ListChecks className="h-4 w-4" />
                <span>Tasks</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/buckets">
                <Inbox className="h-4 w-4" />
                <span>Buckets</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/first-assigned">
                <UserCheck className="h-4 w-4" />
                <span>First Assigned</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="/reports">
                <FileText className="h-4 w-4" />
                <span>Reports</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <a href="#">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
