import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, Smartphone, X, Zap, CheckCircle2, HelpCircle, ExternalLink, Globe } from 'lucide-react';

export default function InstallPrompt({ isSettingsPage = false, forceShow = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

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

    // 2. Check iOS User Agent
    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    // 3. LocalStorage dismissal
    const dismissed = localStorage.getItem('nexus_pwa_dismissed') === 'true';
    setIsDismissed(dismissed);

    // 4. Listen for native beforeinstallprompt (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setShowGuideModal(false);
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
    } else {
      // If browsing over HTTP local IP (e.g. 10.78.121.150:5173) or iOS where prompt API isn't directly invokable, show the clay guide modal
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('nexus_pwa_dismissed', 'true');
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
            <h3 className="font-heading font-bold text-white text-base">PROGRESSIVE WEB APP (PWA) INSTALLATION</h3>
            <p className="text-xs text-slate-400">Install NEXUS HOME as a native app on Mobile (Android / iOS) or Laptop</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">App Mode</span>
            <span className={`font-mono font-bold ${isStandalone ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {isStandalone ? 'STANDALONE (INSTALLED)' : 'BROWSER TAB'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Service Worker & Precaching</span>
            <span className="font-mono text-emerald-400 font-semibold">ACTIVE (NetworkOnly Firebase)</span>
          </div>

          {isStandalone ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs mt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>NEXUS HOME is installed in Standalone Mode. Launch from your mobile home screen.</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl font-bold font-heading text-xs bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL NEXUS HOME ON THIS DEVICE</span>
            </button>
          )}
        </div>

        {/* Small Popup Modal for Installation Guide */}
        <AnimatePresence>
          {showGuideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
                onClick={() => setShowGuideModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative z-10 w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-[#121929] p-6 text-white shadow-2xl"
              >
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-white">Mobile Install Guide</h3>
                    <p className="text-[11px] text-cyan-300 font-mono">NEXUS HOME PWA</p>
                  </div>
                </div>

                {isIOS ? (
                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="font-semibold text-white">To install on iPhone / iPad (Safari):</p>
                    <ol className="list-decimal list-inside space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                      <li>Tap the <strong className="text-cyan-400">Share icon (⎕↑)</strong> in Safari.</li>
                      <li>Scroll down and tap <strong className="text-white">'Add to Home Screen'</strong>.</li>
                      <li>Tap <strong className="text-emerald-400">'Add'</strong> at top right.</li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs text-slate-300">
                    <p className="font-semibold text-white">To install on Android / Chrome:</p>
                    <ol className="list-decimal list-inside space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-[11px] leading-relaxed">
                      <li>Tap Chrome Menu (<strong className="text-cyan-400 font-bold">⋮</strong> top right).</li>
                      <li>Select <strong className="text-white">'Add to Home Screen'</strong> or <strong className="text-white">'Install App'</strong>.</li>
                      <li>Tap <strong className="text-emerald-400">'Add / Install'</strong>.</li>
                    </ol>
                    <p className="text-[10px] text-slate-400 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                      💡 <strong>Note:</strong> Browsers require HTTPS for 1-tap automatic popups. When deployed to your HTTPS domain (Render/Vercel), Chrome will show the 1-tap Install prompt automatically!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-full mt-5 py-2.5 rounded-xl font-extrabold text-xs font-heading bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  GOT IT
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Floating Banner on Main Application Pages
  const shouldShowBanner = !isStandalone && (!isDismissed || forceShow) && !installedSuccess;
  if (!shouldShowBanner) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 pointer-events-auto"
        >
          <div className="p-4 sm:p-5 rounded-3xl border border-cyan-500/30 bg-[#121929]/95 backdrop-blur-md text-white shadow-[10px_14px_30px_rgba(0,0,0,0.7),inset_-3px_-3px_8px_rgba(0,0,0,0.5),inset_3px_3px_8px_rgba(6,182,212,0.2)]">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-0.5 shadow-[2px_4px_10px_rgba(6,182,212,0.4)] shrink-0 overflow-hidden">
                <img src="/App_image.png" alt="NEXUS HOME App" className="w-full h-full rounded-[14px] object-cover" />
              </div>

              <div className="flex-1 pr-4">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase">
                  Mobile & Desktop App
                </span>
                <h4 className="font-heading font-extrabold text-sm text-white tracking-tight mt-1">
                  Install NEXUS HOME App
                </h4>
                <p className="text-[11px] text-slate-300 leading-normal mt-1">
                  Add to mobile home screen for full-screen control & background alerts.
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-3 rounded-xl font-extrabold font-heading text-xs bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>INSTALL APP NOW</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                NOT NOW
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Small Popup Modal for Mobile Guidance */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowGuideModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-cyan-500/40 bg-[#121929] p-6 text-white shadow-[12px_16px_36px_rgba(0,0,0,0.8),inset_-4px_-4px_12px_rgba(0,0,0,0.6),inset_4px_4px_12px_rgba(6,182,212,0.2)]"
            >
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-0.5 shadow-[2px_4px_10px_rgba(6,182,212,0.4)] shrink-0 overflow-hidden">
                  <img src="/App_image.png" alt="NEXUS HOME App" className="w-full h-full rounded-[14px] object-cover" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-white">Mobile Install Guide</h3>
                  <p className="text-[10px] text-cyan-400 font-mono">NEXUS HOME PWA</p>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-xs text-slate-300">
                  <p className="font-semibold text-white">To install on iPhone / iPad (Safari):</p>
                  <ol className="list-decimal list-inside space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-[11px] leading-relaxed">
                    <li>Tap the <strong className="text-cyan-400">Share icon (⎕↑)</strong> in Safari's bottom toolbar.</li>
                    <li>Scroll down and tap <strong className="text-white">'Add to Home Screen'</strong>.</li>
                    <li>Tap <strong className="text-emerald-400">'Add'</strong> at top right.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-300">
                  <p className="font-semibold text-white">To install on Android / Chrome:</p>
                  <ol className="list-decimal list-inside space-y-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-[11px] leading-relaxed">
                    <li>Tap Chrome Menu (<strong className="text-cyan-400 text-sm">⋮</strong> top right).</li>
                    <li>Select <strong className="text-white">'Add to Home screen'</strong> or <strong className="text-white">'Install App'</strong>.</li>
                    <li>Confirm <strong className="text-emerald-400">'Add / Install'</strong>.</li>
                  </ol>
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-200 leading-relaxed">
                    💡 <strong>Note on Local Network IP:</strong> Mobile Chrome requires <strong>HTTPS</strong> for 1-tap automatic installation popups. Once deployed to your HTTPS domain (e.g., Render.com), Chrome will show the 1-tap Install prompt automatically!
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full mt-5 py-3 rounded-2xl font-extrabold text-xs font-heading bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all"
              >
                GOT IT
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
