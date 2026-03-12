"use client"

import React from "react"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

import {
  SidebarProvider
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties
      }
    >

      <div className="flex min-h-screen w-full">

        {/* Sidebar */}

        <AppSidebar />

        {/* Content Area */}

        <div className="flex flex-1 flex-col">

          {/* Header */}

          <Header />

          {/* Page Content */}

          <main className="flex-1 overflow-y-auto">

            <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-700">

              {children}

            </div>

          </main>

        </div>

      </div>

    </SidebarProvider>

  )
}