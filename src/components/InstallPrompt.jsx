import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export default function InstallPrompt({
  isDashboardPage = true,
  isInitialLoading = false,
  isSettingsPage = false,
  forceShow = false,
  onNotify,
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDelayPassed, setIsDelayPassed] = useState(false);

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
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 3. Listen for native beforeinstallprompt (Chrome / Android / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Appinstalled event listener
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      if (onNotify) onNotify('NEXUS HOME App installed successfully!', 'success');
      setTimeout(() => setInstalledSuccess(false), 5000);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', checkStandalone);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onNotify]);

  // Delay popup appearance until 2 SECONDS AFTER Dashboard is fully loaded & visualized
  useEffect(() => {
    if (isDashboardPage && !isInitialLoading && !isStandalone && !installedSuccess) {
      const delayTimer = setTimeout(() => {
        setIsDelayPassed(true);
      }, 2000);
      return () => clearTimeout(delayTimer);
    } else {
      setIsDelayPassed(false);
    }
  }, [isDashboardPage, isInitialLoading, isStandalone, installedSuccess]);

  // Automatically disappear 4 seconds AFTER the top message drops down
  useEffect(() => {
    if (isDelayPassed && !isDismissed && !forceShow && !isSettingsPage) {
      const dismissTimer = setTimeout(() => {
        setIsDismissed(true);
      }, 4000);
      return () => clearTimeout(dismissTimer);
    }
  }, [isDelayPassed, isDismissed, forceShow, isSettingsPage]);

  const handleInstallClick = async (e) => {
    e?.stopPropagation();
    if (deferredPrompt) {
      try {
        if (onNotify) onNotify('Opening App Installation Prompt...', 'info');
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setInstalledSuccess(true);
          if (onNotify) onNotify('NEXUS HOME App installation started!', 'success');
          setTimeout(() => setInstalledSuccess(false), 4000);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else if (isIOS) {
      if (onNotify) onNotify('Tap Share icon ➔ "Add to Home Screen" to install app', 'info');
    } else {
      if (onNotify) onNotify('Tap browser menu (⋮ or ⋯) ➔ Install App or Add to Home Screen', 'info');
    }
  };

  const handleDismiss = (e) => {
    e?.stopPropagation();
    setIsDismissed(true);
  };

  // Do not render top drop prompt inside installed standalone app mode
  if (isStandalone && !isSettingsPage) {
    return null;
  }

  // Embedded Settings Page Section
  if (isSettingsPage) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 clay-badge">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">INSTALL PWA APP</h3>
            <p className="text-xs text-slate-400 font-mono">Mobile App Experience & Background Notifications</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
          {isStandalone ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>NEXUS HOME is installed as a Native PWA App.</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl font-bold font-heading text-xs bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL NEXUS HOME APP</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Minimal Top Drop Banner: Displays ONLY on Dashboard 2s AFTER visualization & auto-disappears after 4s
  const shouldShowBanner =
    !isStandalone &&
    isDashboardPage &&
    isDelayPassed &&
    (!isDismissed || forceShow) &&
    !installedSuccess;

  if (!shouldShowBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -70, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 pointer-events-auto select-none"
      >
        <div className="p-2.5 sm:p-3 rounded-2xl border border-cyan-500/40 bg-slate-900/95 text-slate-100 shadow-[0_16px_36px_rgba(0,0,0,0.65)] backdrop-blur-2xl flex items-center justify-between gap-3 clay-card">
          {/* App Icon */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-0.5 shrink-0 shadow-lg">
            <img src="/App_image.png" alt="NEXUS HOME App Icon" className="w-full h-full rounded-[9px] object-cover" />
          </div>

          {/* Minimal Install Button */}
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3.5 rounded-xl font-extrabold font-heading text-xs bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 truncate"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">INSTALL APP</span>
          </button>

          {/* Dismiss Icon */}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
