import React from 'react'

import Link  from 'next/link';
import { Sparkles } from 'lucide-react';
import {ThemeToggle} from '../theme-toggle'
import {Button } from "@/components/ui/button"
import Logo from '../logo';
export default function Navigation() {
  return (
                <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Logo />
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">Features</Link>
                        <Link href="#pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">Pricing</Link>
                        <Link href="#docs" className="text-sm text-muted-foreground hover:text-white transition-colors">Documentation</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/login">
                            <Button variant="ghost" className="text-muted-foreground hover:text-white">Sign In</Button>
                        </Link>
                        <Link href="/register">
                            <Button className=" hover:bg-white/90">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>
  )
}
