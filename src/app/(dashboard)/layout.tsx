import React from "react"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties
      }
    >
      <div className="flex min-h-screen w-full bg-background">

        {/* Sidebar */}
        <AppSidebar />

        {/* Content Area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>

        </div>
      </div>
    </SidebarProvider>
  )
}