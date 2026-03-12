import React from 'react'
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
       <footer className="py-12 border-t border-white/5 bg-black/20">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-semibold">C0C-AI</span>
                    </div>
                    <p className="text-xs text-muted-foreground">© 2026 C0C-AI Content Engine. Modular Monolith Series. All rights reserved.</p>
                </div>
            </footer>
  )
}
