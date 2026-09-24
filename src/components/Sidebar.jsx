import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Sliders, Activity, BarChart2, Settings, ShieldCheck, Zap } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const content = (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-0.5 flex items-center justify-center clay-badge overflow-hidden">
          <img src="/App_image.png" alt="NEXUS HOME App" className="w-full h-full rounded-[14px] object-cover" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            NEXUS <span className="text-cyan-400 font-extrabold">HOME</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Claymorphism IoT</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 clay-badge'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute left-0 w-1.5 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_8px_#06b6d4]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Footer Badge */}
      <div className="pt-6 border-t border-slate-800/80 px-2">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 clay-inset-dark">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-[11px] font-semibold text-slate-300 truncate">ESP32 Core Online</p>
            <p className="text-[9px] text-slate-500">Firebase Realtime SDK</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 clay-card rounded-none rounded-r-3xl border-r border-slate-800/60 z-30">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-72 clay-card h-full rounded-none rounded-r-3xl border-r border-slate-800/80 z-10"
          >
            {content}
          </motion.div>
        </div>
      )}
    </>
  );
}
