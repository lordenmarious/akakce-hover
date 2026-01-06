/**
 * Favorites Management Script
 * Version 2.2 - Full Page Dashboard
 */

const api = typeof browser !== 'undefined' ? browser : chrome;

// State
let currentView = 'list';
let favoritesData = {};

// Elements
const container = document.getElementById('favorites-container');
const emptyState = document.getElementById('empty-state');
const countText = document.getElementById('count-text');
const listViewBtn = document.getElementById('list-view-btn');
const gridViewBtn = document.getElementById('grid-view-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadFavorites();
});

// View Switching
listViewBtn.addEventListener('click', () => setView('list'));
gridViewBtn.addEventListener('click', () => setView('grid'));

function setView(view) {
    currentView = view;
    container.className = `${view}-container`;

    listViewBtn.classList.toggle('active', view === 'list');
    gridViewBtn.classList.toggle('active', view === 'grid');

    api.storage.local.set({ favoritesView: view });
    renderFavorites(favoritesData);
}

function loadSettings() {
    api.storage.local.get({ favoritesView: 'list' }).then(result => {
        if (result.favoritesView) {
            setView(result.favoritesView);
        }
    });
}

function loadFavorites() {
    api.runtime.sendMessage({ action: "GET_FAVORITES" }).then((response) => {
        if (response && response.favorites) {
            favoritesData = response.favorites;
            renderFavorites(favoritesData);
        }
    }).catch(err => {
        console.error('Favorites loading failed:', err);
    });
}

function renderFavorites(favorites) {
    const items = Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt);
    countText.textContent = `${items.length} adet kayıtlı ürün bulundu`;

    if (items.length === 0) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    container.style.display = currentView === 'list' ? 'flex' : 'grid';

    container.innerHTML = items.map(item => `
        <div class="favorite-card" data-id="${item.id}">
            <button class="delete-btn" data-id="${item.id}" title="Listeden Kaldır">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
            <div class="card-icon">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" onerror="this.onerror=null; this.parentElement.innerHTML='${getSiteEmoji(item.site)}';">` : getSiteEmoji(item.site)}
            </div>
            <div class="card-content">
                <div class="card-title" title="${item.title}">${item.title}</div>
                <div class="card-meta">
                    <span class="site-tag">${item.site}</span>
                    <span class="dot">•</span>
                    <span class="date-tag">${formatDate(item.addedAt)}</span>
                </div>
                <div class="card-actions">
                    <a href="https://www.akakce.com/arama/?q=${encodeURIComponent(item.searchQuery)}" target="_blank" class="action-btn btn-compare">Fiyat Karşılaştır</a>
                    <a href="${item.url}" target="_blank" class="action-btn btn-store">Ürün Sayfası</a>
                </div>
            </div>
        </div>
    `).join('');

    // Attach Delete Events
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('Bu ürünü favorilerinizden kaldırmak istediğinize emin misiniz?')) {
                api.runtime.sendMessage({ action: "REMOVE_FAVORITE", id }).then(() => {
                    loadFavorites();
                });
            }
        });
    });
}

function getSiteEmoji(site) {
    if (!site) return '📦';
    const s = site.toLowerCase();
    if (s.includes('amazon')) return '🅰️';
    if (s.includes('trendyol')) return '🟠';
    if (s.includes('hepsiburada')) return '🛍️';
    return '📦';
}

function formatDate(timestamp) {
    if (!timestamp) return 'Bilinmiyor';
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}
