/**
 * Ekka Shop - Wishlist Manager
 * IndexedDB-based wishlist with offline persistence
 * Version: 1.0.0
 */

(function($) {
  'use strict';

  // Configuration
  const DB_NAME = 'EkkaDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'wishlist';
  const COOKIE_NAME = 'ekka_wishlist'; // For migration from old cookie-based system

  /**
   * Wishlist Manager Class
   */
  class WishlistManager {
    constructor() {
      this.db = null;
      this.initialized = false;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
      if (this.initialized) {
        return;
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('[Wishlist] Error opening database:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.initialized = true;
          console.log('[Wishlist] Database opened successfully');

          // Migrate from cookies if needed
          this.migrateCookies();

          // Update UI badge
          this.syncUIBadge();

          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'productId' });

            // Create indexes
            objectStore.createIndex('addedDate', 'addedDate', { unique: false });
            objectStore.createIndex('productName', 'productName', { unique: false });

            console.log('[Wishlist] Object store created');
          }
        };
      });
    }

    /**
     * Add product to wishlist
     */
    async addToWishlist(product) {
      if (!this.initialized) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        // Prepare product data
        const wishlistItem = {
          productId: product.productId || this.generateProductId(product),
          productName: product.productName || '',
          productPrice: product.productPrice || '',
          productImage: product.productImage || '',
          productUrl: product.productUrl || window.location.href,
          addedDate: new Date().toISOString()
        };

        const request = objectStore.add(wishlistItem);

        request.onsuccess = () => {
          console.log('[Wishlist] Product added:', wishlistItem.productName);
          this.syncUIBadge();
          this.showToast(`${wishlistItem.productName} ajouté à la liste de souhaits`);
          resolve(wishlistItem);
        };

        request.onerror = () => {
          // Product might already exist
          if (request.error.name === 'ConstraintError') {
            console.log('[Wishlist] Product already in wishlist');
            this.showToast('Produit déjà dans la liste de souhaits');
            resolve(null);
          } else {
            console.error('[Wishlist] Error adding product:', request.error);
            reject(request.error);
          }
        };
      });
    }

    /**
     * Remove product from wishlist
     */
    async removeFromWishlist(productId) {
      if (!this.initialized) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        const request = objectStore.delete(productId);

        request.onsuccess = () => {
          console.log('[Wishlist] Product removed:', productId);
          this.syncUIBadge();
          this.showToast('Produit retiré de la liste de souhaits');
          resolve();
        };

        request.onerror = () => {
          console.error('[Wishlist] Error removing product:', request.error);
          reject(request.error);
        };
      });
    }

    /**
     * Get all wishlist items
     */
    async getWishlist() {
      if (!this.initialized) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);

        const request = objectStore.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.error('[Wishlist] Error getting wishlist:', request.error);
          reject(request.error);
        };
      });
    }

    /**
     * Get wishlist count
     */
    async getWishlistCount() {
      if (!this.initialized) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);

        const request = objectStore.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.error('[Wishlist] Error counting wishlist:', request.error);
          reject(request.error);
        };
      });
    }

    /**
     * Check if product is in wishlist
     */
    async isInWishlist(productId) {
      if (!this.initialized) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);

        const request = objectStore.get(productId);

        request.onsuccess = () => {
          resolve(request.result !== undefined);
        };

        request.onerror = () => {
          console.error('[Wishlist] Error checking wishlist:', request.error);
          reject(request.error);
        };
      });
    }

    /**
     * Clear entire wishlist
     */
    async clearWishlist() {
      if (!this.initialized) {
        await this.init();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);

        const request = objectStore.clear();

        request.onsuccess = () => {
          console.log('[Wishlist] Wishlist cleared');
          this.syncUIBadge();
          this.showToast('Liste de souhaits vidée');
          resolve();
        };

        request.onerror = () => {
          console.error('[Wishlist] Error clearing wishlist:', request.error);
          reject(request.error);
        };
      });
    }

    /**
     * Export wishlist as JSON
     */
    async exportWishlist() {
      const wishlist = await this.getWishlist();
      const json = JSON.stringify(wishlist, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `ekka-wishlist-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showToast('Liste de souhaits exportée');
    }

    /**
     * Sync UI badge count
     */
    async syncUIBadge() {
      try {
        const count = await this.getWishlistCount();
        const $badge = $('.ec-header-wishlist .ec-header-count');

        if ($badge.length) {
          $badge.text(count);

          if (count > 0) {
            $badge.show();
          } else {
            $badge.hide();
          }
        }
      } catch (error) {
        console.error('[Wishlist] Error syncing badge:', error);
      }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
      // Try to use existing toast system
      const $existingToast = $('#wishlist_toast');
      if ($existingToast.length) {
        $existingToast.find('.toast-body').text(message);
        $existingToast.addClass('show');
        setTimeout(() => {
          $existingToast.removeClass('show');
        }, 3000);
        return;
      }

      // Create new toast
      let $toast = $('.pwa-toast');
      if (!$toast.length) {
        $toast = $('<div class="pwa-toast"></div>');
        $('body').append($toast);
      }

      $toast.text(message).addClass('show');
      setTimeout(() => {
        $toast.removeClass('show');
      }, 3000);
    }

    /**
     * Generate product ID from product data
     */
    generateProductId(product) {
      // Try to extract ID from URL or name
      const url = product.productUrl || window.location.href;
      const urlMatch = url.match(/product[/-](\d+)/i);
      if (urlMatch) {
        return 'prod-' + urlMatch[1];
      }

      // Fallback: use name hash
      const name = product.productName || 'unknown';
      return 'prod-' + this.hashCode(name);
    }

    /**
     * Simple hash function for string
     */
    hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    }

    /**
     * Migrate from cookie-based wishlist
     */
    async migrateCookies() {
      try {
        const cookieValue = this.getCookie(COOKIE_NAME);
        if (!cookieValue) {
          return;
        }

        console.log('[Wishlist] Migrating from cookies...');

        // Parse cookie data (format may vary)
        let productIds = [];
        try {
          productIds = JSON.parse(cookieValue);
        } catch (e) {
          productIds = cookieValue.split(',');
        }

        // Migrate each product
        for (const id of productIds) {
          const product = {
            productId: id.toString(),
            productName: 'Migrated Product',
            productPrice: '',
            productImage: '',
            productUrl: '',
            addedDate: new Date().toISOString()
          };

          try {
            await this.addToWishlist(product);
          } catch (e) {
            console.error('[Wishlist] Error migrating product:', e);
          }
        }

        // Delete old cookie
        this.deleteCookie(COOKIE_NAME);
        console.log('[Wishlist] Migration complete');
      } catch (error) {
        console.error('[Wishlist] Migration error:', error);
      }
    }

    /**
     * Get cookie value
     */
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop().split(';').shift();
      }
      return null;
    }

    /**
     * Delete cookie
     */
    deleteCookie(name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }

  // Create global instance
  window.wishlistManager = new WishlistManager();

  // Initialize on DOM ready
  $(document).ready(function() {
    // Initialize wishlist manager
    window.wishlistManager.init().then(() => {
      console.log('[Wishlist] Manager initialized');
    }).catch((error) => {
      console.error('[Wishlist] Initialization failed:', error);
    });

    // Setup event handlers for wishlist buttons
    setupWishlistButtons();
  });

  /**
   * Setup wishlist button event handlers
   */
  function setupWishlistButtons() {
    // Add to wishlist button
    $(document).on('click', '.ec-btn-group.wishlist, .add-to-wishlist', function(e) {
      e.preventDefault();

      const $button = $(this);
      const $productCard = $button.closest('.ec-product-inner, .product-item, [data-product-id]');

      // Extract product data
      const product = {
        productId: $productCard.data('product-id') || $productCard.find('[data-product-id]').data('product-id'),
        productName: $productCard.find('.ec-pro-title, .product-title').text().trim(),
        productPrice: $productCard.find('.ec-price, .product-price .new-price').text().trim(),
        productImage: $productCard.find('.ec-pro-image img, .product-image img').attr('src'),
        productUrl: $productCard.find('.ec-pro-title a, .product-title a').attr('href') || window.location.href
      };

      // Add to wishlist
      window.wishlistManager.addToWishlist(product).then(() => {
        $button.addClass('active');
      }).catch((error) => {
        console.error('[Wishlist] Error adding product:', error);
      });
    });

    // Remove from wishlist button
    $(document).on('click', '.remove-from-wishlist, .pro-wishlist-delete', function(e) {
      e.preventDefault();

      const $button = $(this);
      const $productCard = $button.closest('.ec-product-inner, .product-item, [data-product-id]');
      const productId = $productCard.data('product-id') || $productCard.find('[data-product-id]').data('product-id');

      if (productId) {
        window.wishlistManager.removeFromWishlist(productId).then(() => {
          $button.removeClass('active');
          $productCard.fadeOut(300, function() {
            $(this).remove();
          });
        }).catch((error) => {
          console.error('[Wishlist] Error removing product:', error);
        });
      }
    });

    // Clear wishlist button
    $(document).on('click', '.clear-wishlist', function(e) {
      e.preventDefault();

      if (confirm('Voulez-vous vraiment vider votre liste de souhaits ?')) {
        window.wishlistManager.clearWishlist().then(() => {
          $('.wishlist-items').fadeOut(300);
        });
      }
    });

    // Export wishlist button
    $(document).on('click', '.export-wishlist', function(e) {
      e.preventDefault();
      window.wishlistManager.exportWishlist();
    });
  }

})(jQuery);
