// Background script for Hover Price Extension v2.2
// Cross-browser compatible (Firefox & Chrome)

// Cross-browser API
const api = typeof browser !== 'undefined' ? browser : chrome;

// Load favorites from storage on startup
let favorites = {};

async function loadFavorites() {
    try {
        const result = await api.storage.local.get({ favorites: {} });
        favorites = result.favorites || {};
        console.log("Hover Price: Loaded favorites:", Object.keys(favorites).length);
    } catch (e) {
        console.error("Hover Price: Error loading favorites:", e);
        favorites = {};
    }
}

async function saveFavorites() {
    try {
        await api.storage.local.set({ favorites });
        console.log("Hover Price: Saved favorites:", Object.keys(favorites).length);
    } catch (e) {
        console.error("Hover Price: Error saving favorites:", e);
    }
}

// Initialize
loadFavorites();

// Handle keyboard shortcut (Alt+A)
api.commands.onCommand.addListener((command) => {
    if (command === "open-comparison") {
        api.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            if (tabs[0]) {
                api.tabs.sendMessage(tabs[0].id, { action: "OPEN_COMPARISON" });
            }
        });
    }
});

// Handle messages
api.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ADD_FAVORITE") {
        const id = generateId(request.product.title);
        favorites[id] = {
            id,
            title: request.product.title,
            searchQuery: request.product.searchQuery,
            site: request.product.site,
            url: request.product.url,
            imageUrl: request.product.imageUrl || '',
            addedAt: Date.now(),
            lastChecked: null
        };
        saveFavorites();
        console.log("Hover Price: Favorite added:", id);
        sendResponse({ success: true, id });
        return true;
    }

    if (request.action === "REMOVE_FAVORITE") {
        delete favorites[request.id];
        saveFavorites();
        console.log("Hover Price: Favorite removed:", request.id);
        sendResponse({ success: true });
        return true;
    }

    if (request.action === "GET_FAVORITES") {
        sendResponse({ favorites });
        return true;
    }

    if (request.action === "IS_FAVORITE") {
        const id = generateId(request.title);
        sendResponse({ isFavorite: !!favorites[id], id });
        return true;
    }

    if (request.action === "PING") {
        sendResponse({ status: "OK" });
        return true;
    }

    return false;
});

function generateId(title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        const char = title.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'fav_' + Math.abs(hash).toString(36);
}

console.log("Hover Price background script loaded v2.2 (cross-browser)");
