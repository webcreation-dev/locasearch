/**
 * Locapay - PWA Manager
 * Handles service worker registration, installation prompts, and navigation history
 * Version: 1.0.0
 */

(function () {
  'use strict';

  // Configuration
  const MAX_HISTORY = 50;
  const STORAGE_KEY_HISTORY = 'ekka-nav-history';
  const STORAGE_KEY_INSTALLED = 'ekka-pwa-installed';

  // State
  let deferredPrompt = null;
  let isInstalled = false;

  /**
   * Initialize PWA Manager on DOM ready
   */
  function init() {
    // Check if already installed
    checkIfInstalled();

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      console.log('[PWA] Service Workers not supported');
    }

    // Setup install prompt handling
    setupInstallPrompt();

    // Track navigation history
    trackNavigation();

    // Show update notification if new SW available
    setupUpdateNotifications();

    // Show Safari banner if on iOS
    showSafariBanner();
  }

  /**
   * Register Service Worker
   */
  function registerServiceWorker() {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then(registration => {
          console.log('[PWA] Service Worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }

  /**
   * Check if PWA is already installed
   */
  function checkIfInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled = true;
      localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      return;
    }

    // Check localStorage flag
    if (localStorage.getItem(STORAGE_KEY_INSTALLED) === 'true') {
      isInstalled = true;
    }
  }

  /**
   * Setup install prompt handling
   */
  function setupInstallPrompt() {
    const installBtn = document.getElementById('pwa-install-btn');

    if (!installBtn) {
      console.log('[PWA] Install button not found in DOM');
      return;
    }

    // Hide button if already installed
    if (isInstalled) {
      installBtn.style.display = 'none';
      return;
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', e => {
      console.log('[PWA] beforeinstallprompt event fired');

      // Prevent default browser prompt
      e.preventDefault();

      // Store the event
      deferredPrompt = e;

      // Show install button
      installBtn.style.display = 'block';

      // Add click handler
      installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
          // Show install prompt
          deferredPrompt.prompt();

          // Wait for user choice
          deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] User accepted install');
              localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
              installBtn.style.display = 'none';
              showWelcomeNotification();
            } else {
              console.log('[PWA] User dismissed install');
            }

            deferredPrompt = null;
          });
        }
      });
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      localStorage.setItem(STORAGE_KEY_INSTALLED, 'true');
      installBtn.style.display = 'none';
      showWelcomeNotification();
    });
  }

  /**
   * Track navigation history for offline access
   */
  function trackNavigation() {
    const currentUrl = window.location.href;
    const currentTitle = document.title;

    // Get existing history
    let history = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        history = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[PWA] Error reading navigation history:', e);
    }

    // Create new entry
    const entry = {
      url: currentUrl,
      title: currentTitle,
      timestamp: new Date().toISOString(),
    };

    // Remove duplicate if exists
    history = history.filter(item => item.url !== currentUrl);

    // Add to beginning
    history.unshift(entry);

    // Limit to MAX_HISTORY
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }

    // Save
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('[PWA] Error saving navigation history:', e);
    }

    // Tell service worker to cache this page
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls: [currentUrl],
      });
    }
  }

  /**
   * Get navigation history
   */
  window.getNavigationHistory = function () {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('[PWA] Error reading navigation history:', e);
      return [];
    }
  };

  /**
   * Setup update notifications
   */
  function setupUpdateNotifications() {
    // This will be called when a new service worker is ready
  }

  /**
   * Show update notification
   */
  function showUpdateNotification() {
    // Create update banner
    const banner = document.createElement('div');
    banner.className = 'pwa-update-banner';
    banner.innerHTML = `
      <div class="pwa-update-content">
        <span>Nouvelle version disponible !</span>
        <button class="pwa-update-btn" id="pwa-reload-btn">Actualiser</button>
        <button class="pwa-update-close" id="pwa-update-close">×</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle reload button
    document.getElementById('pwa-reload-btn').addEventListener('click', () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SKIP_WAITING',
        });
      }
      window.location.reload();
    });

    // Handle close button
    document
      .getElementById('pwa-update-close')
      .addEventListener('click', () => {
        banner.remove();
      });

    // Auto-show
    setTimeout(() => {
      banner.classList.add('show');
    }, 100);
  }

  /**
   * Show welcome notification after install
   */
  function showWelcomeNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Bienvenue sur Ekka !', {
            body: "L'application est installée et prête à être utilisée hors ligne.",
            icon: './assets/images/pwa-icons/icon-192x192.png',
            badge: './assets/images/pwa-icons/icon-96x96.png',
            vibrate: [200, 100, 200],
          });
        });
      }
    }
  }

  /**
   * Show Safari installation banner (iOS only)
   */
  function showSafariBanner() {
    // Check if iOS Safari
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;

    if (
      isIOS &&
      !isStandalone &&
      !localStorage.getItem('safari-banner-dismissed')
    ) {
      // Check if banner was shown recently
      const lastShown = localStorage.getItem('safari-banner-last-shown');
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown) > 86400000) {
        // 24 hours
        setTimeout(() => {
          showSafariInstructions();
        }, 3000); // Show after 3 seconds
      }
    }
  }

  /**
   * Show Safari installation instructions
   */
  function showSafariInstructions() {
    const banner = document.createElement('div');
    banner.className = 'pwa-safari-banner';
    banner.innerHTML = `
      <div class="pwa-safari-content">
        <div class="pwa-safari-header">
          <span>Installer Locapay</span>
          <button class="pwa-safari-close" id="pwa-safari-close">×</button>
        </div>
        <div class="pwa-safari-body">
          <p>Pour installer cette application sur votre iPhone :</p>
          <ol>
            <li>Appuyez sur <strong>Partager</strong> <svg width="16" height="16" fill="currentColor"><path d="M8 0l3 3h-2v7H7V3H5l3-3zm6 10v5H2v-5H0v5c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-5h-2z"/></svg></li>
            <li>Puis sur <strong>"Sur l'écran d'accueil"</strong></li>
            <li>Appuyez sur <strong>Ajouter</strong></li>
          </ol>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle close
    document
      .getElementById('pwa-safari-close')
      .addEventListener('click', () => {
        banner.remove();
        localStorage.setItem('safari-banner-dismissed', 'true');
      });

    // Track last shown
    localStorage.setItem('safari-banner-last-shown', Date.now().toString());

    // Auto-show
    setTimeout(() => {
      banner.classList.add('show');
    }, 100);
  }

  /**
   * Request notification permission
   */
  window.requestNotificationPermission = async function () {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  /**
   * Show test notification
   */
  window.showTestNotification = function () {
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Test Notification', {
            body: "Ceci est une notification de test d'Locapay.",
            icon: './assets/images/pwa-icons/icon-192x192.png',
            badge: './assets/images/pwa-icons/icon-96x96.png',
            vibrate: [200, 100, 200],
            actions: [
              { action: 'view', title: 'Voir' },
              { action: 'close', title: 'Fermer' },
            ],
          });
        });
      }
    } else {
      console.log('[PWA] Notification permission not granted');
    }
  };

  /**
   * Check storage usage
   */
  window.checkStorageUsage = async function () {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const percentUsed = (estimate.usage / estimate.quota) * 100;

      console.log('Storage Usage:');
      console.log(`  Used: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Quota: ${(estimate.quota / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Percent: ${percentUsed.toFixed(1)}%`);

      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percent: percentUsed,
      };
    }

    return null;
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
