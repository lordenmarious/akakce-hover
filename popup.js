// Popup script to open favorites in a new tab
const api = typeof browser !== 'undefined' ? browser : chrome;

document.getElementById('open-favorites').addEventListener('click', () => {
    api.tabs.create({
        url: api.runtime.getURL('favorites.html')
    });
});
