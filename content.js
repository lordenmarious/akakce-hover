// Content script for Hover Price Extension v2.2
// Cross-browser compatible (Firefox & Chrome)

(function () {
    'use strict';

    // Cross-browser API
    const api = typeof browser !== 'undefined' ? browser : chrome;

    let currentTitle = "";
    let tooltipContainer = null;
    let lastHoveredItem = null;
    let hoverTimeout = null;
    let externalPopup = null;

    const SETTINGS = {
        hoverDelay: 600,
        popupWidth: 450,
        popupHeight: 700
    };

    const SITE_CONFIG = {
        'amazon.com.tr': {
            productTitle: '#productTitle',
            productImage: '#landingImage, #imgBlkFront',
            listingItem: '.s-result-item[data-asin], .s-result-item.s-asin',
            listingTitle: 'h2 a, .a-link-normal .a-text-normal'
        },
        'trendyol.com': {
            productTitle: 'h1.product-title, h1.pr-new-br, h1[class*="product"]',
            productImage: '.product-image, .product-container img, .gallery-container img',
            listingItem: '.p-card-wrppr, [data-id]',
            listingTitle: '.prdct-desc-cntnr-name span'
        },
        'hepsiburada.com': {
            productTitle: 'h1',
            productImage: 'img[data-img-name="product-image"], .product-image-wrapper img, img[data-test-id="main-product-image"]',
            listingItem: '[data-test-id="product-card"]',
            listingTitle: 'h3, [data-test-id="product-card-name"]'
        }
    };

    function getCurrentSite() {
        const hostname = window.location.hostname;
        for (const site in SITE_CONFIG) {
            if (hostname.includes(site)) {
                return { config: SITE_CONFIG[site], name: site };
            }
        }
        return { config: SITE_CONFIG['amazon.com.tr'], name: 'amazon.com.tr' };
    }

    const { config, name: siteName } = getCurrentSite();

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    }

    function onReady() {
        setTimeout(() => {
            setupListingHovers();
            checkProduct();
        }, 2000);

        const observer = new MutationObserver(() => {
            setupListingHovers();
            checkProduct();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        if (api && api.runtime) {
            api.runtime.onMessage.addListener((request) => {
                if (request.action === "OPEN_COMPARISON") {
                    triggerSearch();
                }
            });
        }
    }

    function setupListingHovers() {
        const items = document.querySelectorAll(config.listingItem);

        items.forEach(item => {
            if (item.dataset.hpInit) return;
            item.dataset.hpInit = "1";

            item.addEventListener('mouseenter', () => {
                const titleEl = item.querySelector(config.listingTitle);
                if (titleEl && titleEl.innerText) {
                    const title = titleEl.innerText.trim();
                    if (!title) return;

                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        if (lastHoveredItem === title) return;
                        lastHoveredItem = title;

                        const rect = titleEl.getBoundingClientRect();
                        showTooltip(title, {
                            x: rect.left + window.scrollX,
                            y: rect.bottom + window.scrollY + 8
                        });
                    }, SETTINGS.hoverDelay);
                }
            });

            item.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
            });
        });
    }

    function checkProduct() {
        const titleEl = document.querySelector(config.productTitle);
        if (!titleEl) return;

        const rawTitle = titleEl.innerText.trim();
        if (!rawTitle || rawTitle === currentTitle) return;
        currentTitle = rawTitle;

        const searchQuery = cleanProductTitle(rawTitle);
        showFloatingButton(searchQuery, rawTitle);
    }

    function triggerSearch() {
        const titleEl = document.querySelector(config.productTitle);
        if (titleEl) {
            const url = `https://www.akakce.com/arama/?q=${encodeURIComponent(cleanProductTitle(titleEl.innerText.trim()))}`;
            openPopup(url);
        }
    }

    function showFloatingButton(searchQuery, fullTitle) {
        if (!searchQuery) return;

        // Cleanup old elements if they exist
        const oldContainer = document.getElementById('akakce-buttons');
        if (oldContainer) oldContainer.remove();

        const searchUrl = `https://www.akakce.com/arama/?q=${encodeURIComponent(searchQuery)}`;

        // Create container
        let container = document.getElementById('hp-buttons');
        if (!container) {
            container = document.createElement('div');
            container.id = 'hp-buttons';
            container.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 10000000;
            `;
            document.body.appendChild(container);
        }

        // Search button
        let searchBtn = document.getElementById('hp-float-btn');
        if (!searchBtn) {
            searchBtn = document.createElement('div');
            searchBtn.id = 'hp-float-btn';
            searchBtn.className = 'hp-float-button';
            container.appendChild(searchBtn);
        }
        searchBtn.innerHTML = `
            <div class="hp-btn-icon">🔍</div>
            <div class="hp-btn-text">Fiyat<br>Karşılaştır</div>
        `;
        searchBtn.onclick = () => openPopup(searchUrl);

        // Favorite button
        let favBtn = document.getElementById('hp-fav-btn');
        if (!favBtn) {
            favBtn = document.createElement('div');
            favBtn.id = 'hp-fav-btn';
            favBtn.className = 'hp-float-button hp-fav-button';
            container.appendChild(favBtn);
        }

        // Check if already favorite
        api.runtime.sendMessage({
            action: "IS_FAVORITE",
            title: fullTitle
        }).then((response) => {
            updateFavButton(favBtn, response.isFavorite, fullTitle, searchQuery);
        }).catch(() => {
            updateFavButton(favBtn, false, fullTitle, searchQuery);
        });
    }

    function updateFavButton(btn, isFavorite, fullTitle, searchQuery) {
        if (isFavorite) {
            btn.innerHTML = `
                <div class="hp-btn-icon">⭐</div>
                <div class="hp-btn-text">Favoride</div>
            `;
            btn.classList.add('is-favorite');
        } else {
            btn.innerHTML = `
                <div class="hp-btn-icon">☆</div>
                <div class="hp-btn-text">Favoriye<br>Ekle</div>
            `;
            btn.classList.remove('is-favorite');
        }

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (btn.classList.contains('is-favorite')) {
                // Remove from favorites
                api.runtime.sendMessage({
                    action: "IS_FAVORITE",
                    title: fullTitle
                }).then((r) => {
                    api.runtime.sendMessage({
                        action: "REMOVE_FAVORITE",
                        id: r.id
                    }).then(() => {
                        updateFavButton(btn, false, fullTitle, searchQuery);
                    });
                });
            } else {
                // Add to favorites
                const imgEl = document.querySelector(config.productImage);
                const imageUrl = imgEl ? imgEl.src : '';

                api.runtime.sendMessage({
                    action: "ADD_FAVORITE",
                    product: {
                        title: fullTitle,
                        searchQuery: searchQuery,
                        site: siteName,
                        url: window.location.href,
                        imageUrl: imageUrl
                    }
                }).then(() => {
                    updateFavButton(btn, true, fullTitle, searchQuery);
                });
            }
        };
    }

    function showTooltip(query, pos) {
        // Cleanup old tooltip if it exists
        const oldTooltip = document.getElementById('akakce-tooltip');
        if (oldTooltip) oldTooltip.remove();

        const searchUrl = `https://www.akakce.com/arama/?q=${encodeURIComponent(cleanProductTitle(query))}`;

        let div = document.getElementById('hp-tooltip');
        if (!div) {
            div = document.createElement('div');
            div.id = 'hp-tooltip';
            div.className = 'hp-tooltip';
            document.body.appendChild(div);
        }

        div.style.left = `${pos.x}px`;
        div.style.top = `${pos.y}px`;
        div.style.display = 'block';

        div.innerHTML = `
            <div class="hp-tooltip-content">
                <span class="hp-tooltip-icon">🔍</span>
                <span>Fiyat Karşılaştır</span>
            </div>
        `;
        div.onclick = () => openPopup(searchUrl);

        tooltipContainer = div;
    }

    function openPopup(url) {
        const width = SETTINGS.popupWidth;
        const height = SETTINGS.popupHeight;
        const left = window.screenX + window.outerWidth - width - 50;
        const top = window.screenY + 100;

        if (externalPopup && !externalPopup.closed) externalPopup.close();

        externalPopup = window.open(url, 'PriceComparisonPopup',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);

        if (externalPopup) externalPopup.focus();
    }

    init();
})();
