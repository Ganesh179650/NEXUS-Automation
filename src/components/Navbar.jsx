import React from 'react';
import { Menu, Zap } from 'lucide-react';

export default function Navbar({ onOpenMobileMenu }) {
  return (
    <header className="sticky top-0 z-20 w-full clay-card rounded-none rounded-b-3xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Trigger Button */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Header Brand Subtitle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 overflow-hidden clay-badge p-0.5">
              <img src="/App_image.png" alt="NEXUS HOME" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight leading-none">
                NEXUS HOME
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
                IoT Home Automation & Environmental Monitoring
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
