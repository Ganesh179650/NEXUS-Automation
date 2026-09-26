import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export default function InstallPrompt({ isSettingsPage = false, forceShow = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check standalone mode
    const checkStandalone = () => {
      const inStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(inStandaloneMode);
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 2. Listen for native beforeinstallprompt (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 4000);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Do not render floating prompt inside standalone app mode
  if (isStandalone && !isSettingsPage) {
    return null;
  }

  // Embedded Settings Page Section
  if (isSettingsPage) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">Install App</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
          {isStandalone ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>NEXUS HOME is installed on this device.</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl font-bold font-heading text-xs bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL NEXUS HOME</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Floating Banner on Main Application Pages - Shows every time app is opened in browser
  const shouldShowBanner = !isStandalone && (!isDismissed || forceShow) && !installedSuccess;
  if (!shouldShowBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xs z-40 pointer-events-auto"
      >
        <div className="p-4 rounded-3xl border border-cyan-500/30 bg-[#121929]/95 backdrop-blur-md text-white shadow-[10px_14px_30px_rgba(0,0,0,0.7)] relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 p-0.5 shrink-0 overflow-hidden">
              <img src="/App_image.png" alt="NEXUS HOME App" className="w-full h-full rounded-[10px] object-cover" />
            </div>

            <div>
              <h4 className="font-heading font-extrabold text-sm text-white tracking-tight">
                Install NEXUS HOME
              </h4>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-3 rounded-xl font-extrabold font-heading text-xs bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL APP</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


