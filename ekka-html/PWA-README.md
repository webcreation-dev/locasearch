# Locapay - Documentation PWA

## Vue d'ensemble

Locapay a été transformé en Progressive Web App (PWA) complète avec fonctionnalités offline, notifications push, et installation sur l'écran d'accueil.

## Fonctionnalités PWA Implémentées

### ✅ 1. Mode Hors Ligne

- **109 pages HTML** disponibles offline via caching progressif
- Stratégie **Network-First** pour les pages (contenu frais quand connecté)
- Stratégie **Cache-First** pour les assets (CSS, JS, images)
- Page offline élégante pour les pages non mises en cache

### ✅ 2. Installation

- Bouton d'installation discret dans le header (apparaît automatiquement sur Chrome/Edge)
- Installation détectée automatiquement (bouton masqué une fois installé)
- Mode standalone (sans UI navigateur)
- Support Safari iOS avec instructions manuelles

### ✅ 3. Wishlist Persistante

- **IndexedDB** pour stockage offline robuste
- Synchronisation automatique avec le compteur du header
- Migration automatique depuis l'ancien système de cookies
- Export JSON pour sauvegarde

### ✅ 4. Historique de Navigation

- 50 dernières pages visitées stockées dans localStorage
- Pages récentes pré-cachées pour accès offline rapide

### ✅ 5. Notifications Push

- Infrastructure de base prête (service worker configuré)
- Notifications de bienvenue après installation
- Prêt pour intégration backend future (commenté dans le code)

## Fichiers Créés

```
ekka-html/
├── manifest.json                          # Manifest PWA
├── sw.js                                  # Service Worker
├── offline.html                           # Page offline de fallback
├── PWA-README.md                          # Cette documentation
├── assets/
│   ├── css/
│   │   └── pwa-custom.css                # Styles PWA
│   ├── js/
│   │   ├── pwa.js                        # Gestionnaire PWA principal
│   │   └── wishlist-manager.js           # Gestionnaire wishlist IndexedDB
│   └── images/
│       └── pwa-icons/                    # 8 icônes PWA (72 à 512px)
│           ├── icon-72x72.png
│           ├── icon-96x96.png
│           ├── icon-128x128.png
│           ├── icon-144x144.png
│           ├── icon-152x152.png
│           ├── icon-192x192.png
│           ├── icon-384x384.png
│           └── icon-512x512.png
```

## Fichiers Modifiés

### index.html

**Modifications dans `<head>` :**

```html
<!-- PWA Manifest -->
<link rel="manifest" href="manifest.json" />
<meta name="theme-color" content="#3474d4" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Locapay" />
<link
  rel="apple-touch-icon"
  sizes="192x192"
  href="assets/images/pwa-icons/icon-192x192.png"
/>

<!-- PWA Custom Styles -->
<link rel="stylesheet" href="assets/css/pwa-custom.css" />
```

**Bouton installation dans header (après cart button) :**

```html
<!-- PWA Install Button -->
<button
  id="pwa-install-btn"
  class="ec-header-btn pwa-install-btn"
  style="display: none;"
  title="Installer l'application"
>
  <div class="header-icon">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" />
    </svg>
  </div>
</button>
```

**Scripts avant `</body>` :**

```html
<!-- PWA Scripts -->
<script src="assets/js/pwa.js"></script>
<script src="assets/js/wishlist-manager.js"></script>
```

## Installation et Test

### 1. Serveur Local (Développement)

La PWA nécessite HTTPS (ou localhost). Pour tester localement :

**Option A: Python HTTP Server**

```bash
cd ekka-html
python3 -m http.server 8000
# Visitez: http://localhost:8000
```

**Option B: Node.js http-server**

```bash
npm install -g http-server
cd ekka-html
http-server -p 8000
# Visitez: http://localhost:8000
```

**Option C: PHP Built-in Server**

```bash
cd ekka-html
php -S localhost:8000
# Visitez: http://localhost:8000
```

### 2. Test du Service Worker

1. Ouvrez Chrome DevTools (F12)
2. Allez dans **Application** > **Service Workers**
3. Vérifiez que `sw.js` est enregistré et actif
4. Testez le mode offline :
   - **Application** > **Service Workers** > Cochez "Offline"
   - Naviguez sur le site, les pages déjà visitées doivent charger

### 3. Test du Manifest

1. **Application** > **Manifest**
2. Vérifiez que toutes les propriétés sont chargées
3. Vérifiez que les icônes s'affichent (pas de 404)

### 4. Test de l'Installation

**Chrome/Edge (Desktop) :**

1. Le bouton d'installation apparaît automatiquement dans le header
2. Cliquez dessus pour installer
3. L'app s'ouvre en mode standalone

**Chrome (Mobile Android) :**

1. Menu > "Ajouter à l'écran d'accueil"
2. Ou le bouton dans le header si disponible

**Safari (iOS) :**

1. Bouton Partager
2. "Sur l'écran d'accueil"
3. Ajouter

### 5. Test de la Wishlist

**Console Chrome :**

```javascript
// Vérifier la base de données
window.wishlistManager.getWishlist().then(console.log);

// Compter les items
window.wishlistManager.getWishlistCount().then(console.log);

// Exporter la wishlist
window.wishlistManager.exportWishlist();
```

**Dans l'interface :**

1. Cliquez sur un bouton "Wishlist" sur un produit
2. Vérifiez que le compteur header s'incrémente
3. Fermez et rouvrez le navigateur
4. Le compteur doit persister

### 6. Test des Notifications

**Console Chrome :**

```javascript
// Demander permission
await requestNotificationPermission();

// Afficher notification test
showTestNotification();
```

### 7. Lighthouse Audit

1. Chrome DevTools > **Lighthouse**
2. Sélectionnez "Progressive Web App"
3. Cliquez "Analyze page load"
4. **Score cible : 90+/100**

## Déploiement en Production

### ⚠️ IMPORTANT : HTTPS Obligatoire

Les PWA **NE FONCTIONNENT PAS** sans HTTPS (sauf localhost).

### Options d'Hébergement avec HTTPS Gratuit

#### Option 1 : Netlify (Recommandé)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Déployer
cd ekka-html
netlify deploy --prod
```

**Avantages :** HTTPS automatique, CDN global, déploiement instantané

#### Option 2 : Vercel

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
cd ekka-html
vercel --prod
```

#### Option 3 : GitHub Pages

1. Push le dossier `ekka-html` vers GitHub
2. Settings > Pages > Enable
3. HTTPS automatique sur `https://username.github.io/repo`

#### Option 4 : Cloudflare Pages

1. Connectez votre repo GitHub
2. Build settings : aucun (HTML statique)
3. Publish directory : `ekka-html`

#### Option 5 : Hébergement Traditionnel + Let's Encrypt

```bash
# Sur serveur Linux avec Certbot
sudo certbot --nginx -d votredomaine.com
```

### Configuration Post-Déploiement

**Si déployé à la racine `/` :**

Modifiez ces fichiers :

**manifest.json :**

```json
"start_url": "/",
"scope": "/"
```

**pwa.js :**

```javascript
navigator.serviceWorker.register('/sw.js');
```

**index.html (et autres HTML) :**

```html
<link rel="manifest" href="/manifest.json" />
```

**sw.js - APP_SHELL :**

```javascript
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  // ... autres chemins avec /
];
```

## Appliquer PWA aux 108 Autres Fichiers HTML

Vous avez 2 options :

### Option 1 : Find & Replace IDE (Recommandé)

**Étape 1 : Ajouter les meta tags PWA dans `<head>`**

Trouvez (dans tous les .html) :

```
<link rel="apple-touch-icon" href="assets/images/favicon/favicon.png" />
    <meta name="msapplication-TileImage" content="assets/images/favicon/favicon.png" />
```

Remplacez par :

```
<link rel="apple-touch-icon" href="assets/images/favicon/favicon.png" />
    <meta name="msapplication-TileImage" content="assets/images/favicon/favicon.png" />

    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#3474d4">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Locapay">
    <link rel="apple-touch-icon" sizes="192x192" href="assets/images/pwa-icons/icon-192x192.png">
```

**Étape 2 : Ajouter CSS PWA**

Trouvez (dans tous les .html) :

```
<link rel="stylesheet" href="assets/css/responsive.css" />
```

Remplacez par :

```
<link rel="stylesheet" href="assets/css/responsive.css" />

    <!-- PWA Custom Styles -->
    <link rel="stylesheet" href="assets/css/pwa-custom.css" />
```

**Étape 3 : Ajouter bouton installation**

Trouvez :

```
<!-- Header Cart End -->
                            </div>
```

Remplacez par :

```
<!-- Header Cart End -->
                                <!-- PWA Install Button -->
                                <button id="pwa-install-btn" class="ec-header-btn pwa-install-btn" style="display: none;" title="Installer l'application">
                                    <div class="header-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z"/>
                                        </svg>
                                    </div>
                                </button>
                                <!-- PWA Install Button End -->
                            </div>
```

**Étape 4 : Ajouter scripts PWA**

Trouvez (avant `</body>`) :

```
<script src="assets/js/main.js"></script>
</body>
```

Remplacez par :

```
<script src="assets/js/main.js"></script>

    <!-- PWA Scripts -->
    <script src="assets/js/pwa.js"></script>
    <script src="assets/js/wishlist-manager.js"></script>
</body>
```

### Option 2 : Script Automatisé (Node.js)

Créez `apply-pwa.js` dans le dossier parent :

```javascript
const fs = require('fs');
const glob = require('glob');

const manifestTags = `
    <!-- PWA Manifest -->
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#3474d4">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="Locapay">
    <link rel="apple-touch-icon" sizes="192x192" href="assets/images/pwa-icons/icon-192x192.png">
`;

const pwaCSS = `
    <!-- PWA Custom Styles -->
    <link rel="stylesheet" href="assets/css/pwa-custom.css" />
`;

const installButton = `
                                <!-- PWA Install Button -->
                                <button id="pwa-install-btn" class="ec-header-btn pwa-install-btn" style="display: none;" title="Installer l'application">
                                    <div class="header-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z"/>
                                        </svg>
                                    </div>
                                </button>
                                <!-- PWA Install Button End -->
`;

const pwaScripts = `
    <!-- PWA Scripts -->
    <script src="assets/js/pwa.js"></script>
    <script src="assets/js/wishlist-manager.js"></script>
`;

glob('ekka-html/**/*.html', (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  files.forEach(file => {
    // Skip index.html (already done)
    if (file.endsWith('index.html')) {
      console.log(`Skipping ${file} (already updated)`);
      return;
    }

    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Add manifest tags
    if (
      !content.includes('PWA Manifest') &&
      content.includes('msapplication-TileImage')
    ) {
      content = content.replace(
        /(<meta name="msapplication-TileImage"[^>]*>)/,
        `$1${manifestTags}`
      );
      modified = true;
    }

    // Add PWA CSS
    if (
      !content.includes('pwa-custom.css') &&
      content.includes('responsive.css')
    ) {
      content = content.replace(
        /(<link rel="stylesheet" href="assets\/css\/responsive\.css"[^>]*>)/,
        `$1${pwaCSS}`
      );
      modified = true;
    }

    // Add install button
    if (
      !content.includes('pwa-install-btn') &&
      content.includes('Header Cart End')
    ) {
      content = content.replace(
        /(<!-- Header Cart End -->)/,
        `$1${installButton}`
      );
      modified = true;
    }

    // Add PWA scripts
    if (!content.includes('pwa.js') && content.includes('main.js')) {
      content = content.replace(
        /(<script src="assets\/js\/main\.js"><\/script>)/,
        `$1${pwaScripts}`
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✓ Updated ${file}`);
    } else {
      console.log(`○ Skipped ${file} (no changes needed)`);
    }
  });

  console.log('\n✅ PWA integration complete for all HTML files!');
});
```

Exécutez :

```bash
npm install glob
node apply-pwa.js
```

## Vérification Post-Application

Après avoir appliqué PWA à tous les fichiers :

```bash
# Vérifier que tous les fichiers ont les modifications
cd ekka-html
grep -l "PWA Manifest" *.html | wc -l
# Devrait afficher 109

grep -l "pwa.js" *.html | wc -l
# Devrait afficher 109
```

## Utilisation de l'API PWA

### Wishlist Manager

```javascript
// Accès global
const wm = window.wishlistManager;

// Ajouter un produit
await wm.addToWishlist({
  productId: 'prod-123',
  productName: 'Super Product',
  productPrice: '$99.99',
  productImage: 'path/to/image.jpg',
  productUrl: 'product-page.html',
});

// Retirer un produit
await wm.removeFromWishlist('prod-123');

// Obtenir toute la wishlist
const items = await wm.getWishlist();

// Compter les items
const count = await wm.getWishlistCount();

// Vérifier si produit dans wishlist
const isIn = await wm.isInWishlist('prod-123');

// Vider la wishlist
await wm.clearWishlist();

// Exporter en JSON
await wm.exportWishlist();
```

### Navigation History

```javascript
// Obtenir l'historique (automatique à chaque page)
const history = getNavigationHistory();
console.log(history); // Array de {url, title, timestamp}
```

### Notifications

```javascript
// Demander permission
const granted = await requestNotificationPermission();

// Afficher notification test
showTestNotification();
```

### Storage

```javascript
// Vérifier usage stockage
const usage = await checkStorageUsage();
console.log(usage); // {usage, quota, percent}
```

## Dépannage

### Le bouton d'installation n'apparaît pas

**Causes possibles :**

1. Pas sur HTTPS (utilisez localhost pour test)
2. App déjà installée (vérifiez `chrome://apps`)
3. Manifest invalide (vérifiez DevTools > Application > Manifest)
4. Service Worker non enregistré (vérifiez console)

**Solution :**

```javascript
// Console DevTools
window.addEventListener('beforeinstallprompt', e => {
  console.log('beforeinstallprompt fired!', e);
});
```

### Service Worker n'enregistre pas

**Vérifiez :**

1. HTTPS ou localhost
2. Chemin correct vers `sw.js`
3. Erreurs dans console

**Force update :**

```javascript
// Console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
location.reload();
```

### Pages ne chargent pas offline

**Vérifiez :**

1. La page a été visitée en ligne d'abord
2. Service Worker est actif
3. Cache contient la page

**Console DevTools :**

```javascript
caches.keys().then(console.log); // Voir les caches
caches
  .open('ekka-pages-v1.0.0')
  .then(cache => cache.keys())
  .then(console.log);
```

### Wishlist ne persiste pas

**Vérifiez IndexedDB :**

1. DevTools > Application > IndexedDB > EkkaDB
2. Vérifiez que la table `wishlist` existe
3. Vérifiez les permissions navigateur

**Reset database :**

```javascript
indexedDB.deleteDatabase('EkkaDB');
location.reload();
```

### Erreur "Quota exceeded"

Le cache est plein (>50MB).

**Solution :**

```javascript
// Vider les caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

## Performance

### Taille des Caches

**App Shell (pré-cache) :** ~5-10 MB
**Pages (runtime) :** ~1-2 MB (109 pages)
**Images (runtime, LRU max 200) :** ~10-20 MB

**Total estimé :** 15-35 MB (bien en-dessous de la limite navigateur de 50-200 MB)

### Temps de Chargement

**Première visite (online) :**

- Installation SW : ~2-3 secondes
- Pré-cache app shell : ~3-5 secondes
- Page load : normal

**Visites suivantes (online) :**

- Page load : instantané (cache-first pour assets)
- HTML : frais du réseau (network-first)

**Offline :**

- Pages cachées : instantané
- Pages non cachées : offline.html immédiat

## Mises à Jour

### Mettre à Jour le Cache

1. Éditez `sw.js` :

```javascript
const CACHE_VERSION = 'v1.1.0'; // Incrémenter
```

2. Déployez la nouvelle version

3. Les utilisateurs verront la bannière "Nouvelle version disponible"

4. Clic sur "Actualiser" → nouveau SW activé

### Forcer la Mise à Jour

```javascript
// Dans pwa.js ou console
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.update());
  });
}
```

## Support Navigateur

| Feature            | Chrome  | Firefox    | Safari       | Edge    |
| ------------------ | ------- | ---------- | ------------ | ------- |
| Service Worker     | ✅ Full | ✅ Full    | ⚠️ iOS 11.3+ | ✅ Full |
| Manifest           | ✅ Full | ⚠️ Partial | ⚠️ Partial   | ✅ Full |
| Install Prompt     | ✅ Yes  | ❌ No      | ❌ Manual    | ✅ Yes  |
| Push Notifications | ✅ Yes  | ✅ Yes     | ⚠️ iOS 16.4+ | ✅ Yes  |
| IndexedDB          | ✅ Yes  | ✅ Yes     | ✅ Yes       | ✅ Yes  |
| Offline            | ✅ Yes  | ✅ Yes     | ✅ Yes       | ✅ Yes  |

## Liens Utiles

**Documentation :**

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

**Outils :**

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Web Manifest Generator](https://app-manifest.firebaseapp.com/)

**Test PWA :**

- [What PWA Can Do Today](https://whatpwacando.today/)
- [PWA Feature Detector](https://tomayac.github.io/pwa-feature-detector/)

## Support

Pour toute question ou problème :

1. Vérifiez cette documentation
2. Consultez la console Chrome DevTools
3. Testez sur localhost d'abord
4. Vérifiez que HTTPS est activé en production

---

**Version PWA :** 1.0.0
**Date :** 2025-11-27
**Auteur :** Claude (Anthropic)
**Template :** Ekka - Ecommerce HTML Template v3.3
