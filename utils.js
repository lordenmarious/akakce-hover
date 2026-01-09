/* Shared utility functions */

// Cross-browser API compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Hibrit Normalleştirme Sistemi
 * v2.0 - Kategori Filtreleme Desteği
 */
const Normalizer = {
    // 0. Akakçe Kategori Eşleştirme Sistemi
    // Anahtar: Akakçe URL slug'ı, Değer: Bu kategoriye ait anahtar kelimeler (lowercase)
    categoryKeywords: {
        'islemci': [
            'intel core', 'amd ryzen', 'i3-', 'i5-', 'i7-', 'i9-', 'i3 ', 'i5 ', 'i7 ', 'i9 ',
            'ryzen 3', 'ryzen 5', 'ryzen 7', 'ryzen 9', 'threadripper', 'xeon', 'pentium',
            'celeron', 'athlon', 'cpu', 'işlemci', 'processor', '12600kf', '13600k', '14600k',
            '5600x', '5800x', '7800x3d', '9800x3d', 'lga1700', 'am5', 'am4'
        ],
        'ekran-karti': [
            'rtx 30', 'rtx 40', 'rtx 50', 'rtx30', 'rtx40', 'rtx50', 'gtx 16', 'gtx16',
            'geforce rtx', 'geforce gtx', 'radeon rx', 'rx 6', 'rx 7', 'rx 9', 'rx6', 'rx7', 'rx9',
            'ekran kartı', 'graphics card', 'gpu', 'nvidia', 'arc a7', 'arc a5',
            '4060', '4070', '4080', '4090', '5060', '5070', '5080', '5090',
            '7600 xt', '7700 xt', '7800 xt', '7900 xt', '9070 xt'
        ],
        'ram-bellek': [
            'ddr4', 'ddr5', 'ram ', ' ram', 'sodimm', 'dimm', 'bellek', 'memory',
            '16gb ram', '32gb ram', '8gb ram', 'cl16', 'cl18', 'cl30', 'cl32',
            'corsair vengeance', 'g.skill', 'kingston fury', 'crucial'
        ],
        'anakart': [
            'anakart', 'motherboard', 'mainboard',
            'b550', 'b650', 'b660', 'b760', 'x570', 'x670', 'z690', 'z790', 'z890',
            'a520', 'a620', 'h610', 'h670', 'h770'
        ],
        'ssd': [
            'ssd', 'nvme', 'm.2 ', 'm2 ', 'solid state', 'sata ssd',
            '500gb ssd', '1tb ssd', '2tb ssd', '4tb ssd',
            'samsung 990', 'samsung 980', 'wd black', 'crucial p5'
        ],
        'hdd': [
            'hdd', 'hard disk', 'sabit disk', 'harddisk',
            '1tb hdd', '2tb hdd', '4tb hdd', '8tb hdd',
            'seagate barracuda', 'wd blue', 'wd purple', 'toshiba p300'
        ],
        'monitor': [
            'monitör', 'monitor', 'inch ', 'inç ',
            '144hz', '165hz', '240hz', '360hz', '4k monitor', 'qhd', 'wqhd',
            'lg ultragear', 'samsung odyssey', 'asus rog', 'aoc gaming', 'dell alienware',
            '27 inch', '32 inch', '24 inch', 'curved monitor', 'kavisli'
        ],
        'laptop': [
            'laptop', 'notebook', 'dizüstü', 'taşınabilir bilgisayar',
            'macbook', 'thinkpad', 'vivobook', 'zenbook', 'ideapad', 'legion',
            'rog strix', 'tuf gaming', 'pavilion gaming', 'victus', 'omen'
        ],
        'klavye': [
            'klavye', 'keyboard', 'mekanik klavye', 'mechanical keyboard',
            'gaming klavye', 'rgb klavye', 'tkl', 'cherry mx', 'outemu', 'gateron',
            'logitech g', 'razer', 'steelseries', 'hyperx', 'corsair k'
        ],
        'mouse': [
            'mouse', 'fare', 'gaming mouse', 'oyuncu mouse',
            'logitech g pro', 'razer deathadder', 'razer viper', 'steelseries rival',
            'zowie', 'pulsar', 'lamzu', 'finalmouse', 'dpi', 'wireless mouse'
        ],
        'kulaklik': [
            'kulaklık', 'headset', 'headphone', 'earphone', 'earbuds', 'tws',
            'gaming kulaklık', 'bluetooth kulaklık', 'kablosuz kulaklık',
            'airpods', 'sony wh', 'bose', 'sennheiser', 'hyperx cloud', 'steelseries arctis'
        ],
        'kasa': [
            'kasa', 'case', 'bilgisayar kasası', 'pc case', 'tower',
            'nzxt h', 'corsair 4000', 'corsair 5000', 'lian li', 'fractal design',
            'mid tower', 'full tower', 'mini itx kasa', 'atx kasa'
        ],
        'psu': [
            'güç kaynağı', 'power supply', 'psu', 'watt ',
            '650w', '750w', '850w', '1000w', '1200w',
            'corsair rm', 'seasonic', 'evga', 'be quiet', '80 plus gold', '80 plus platinum'
        ],
        'sogutucu': [
            'soğutucu', 'cooler', 'fan', 'cpu cooler', 'işlemci soğutucu',
            'aio', 'sıvı soğutma', 'hava soğutma', 'tower cooler',
            'noctua', 'be quiet', 'deepcool', 'corsair h', 'arctic', 'kasa fanı'
        ],
        'telefon': [
            'iphone', 'samsung galaxy', 'xiaomi', 'poco', 'oneplus', 'google pixel',
            'akıllı telefon', 'smartphone', 'cep telefonu', 'android telefon',
            'redmi note', 'galaxy s2', 'galaxy s3', 'iphone 15', 'iphone 16'
        ],
        'tablet': [
            'tablet', 'ipad', 'galaxy tab', 'lenovo tab', 'xiaomi pad',
            'grafik tablet', 'wacom', 'android tablet'
        ]
    },

    /**
     * Ürün başlığından kategori tespit et
     * @param {string} title - Ürün başlığı
     * @returns {string|null} - Akakçe kategori slug'ı veya null
     */
    detectCategory: function (title) {
        if (!title) return null;
        const lowerTitle = title.toLowerCase();

        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            for (const keyword of keywords) {
                if (lowerTitle.includes(keyword)) {
                    return category;
                }
            }
        }
        return null;
    },

    // 1. Her platforma özel gürültü kelimeleri
    platformNoises: {
        "amazon": [/amazon\.com\.tr/gi, /yeni/gi, /fırsat/gi],
        "hepsiburada": [/hepsiburada/gi, /süper fiyat/gi, /yarın kapında/gi],
        "trendyol": [/trendyol/gi, /tıkla gelsin/gi, /satıcı:\s?[\w\s]+/gi],
        "n11": [/n11/gi, /ücretsiz kargo/gi, /n11\.com/gi],
        "itopya": [/hazır sistem/gi, /stokta/gi, /oem/gi],
        "vatan": [/web'e özel/gi, /vatan bilgisayar/gi]
    },

    // 2. Ana temizleme fonksiyonu
    clean: function (title, host) {
        if (!title) return "";
        let cleaned = title.toLowerCase();

        // Platformu belirle
        const hostStr = host || "";
        const platformKey = Object.keys(this.platformNoises).find(key => hostStr.includes(key));

        // A. Platforma özel temizlik
        if (platformKey) {
            this.platformNoises[platformKey].forEach(pattern => {
                cleaned = cleaned.replace(pattern, ' ');
            });
        }

        // B. Bağlantı Tipi ve Birim Koruma (usbc, typec, 350ml, 8gb)
        cleaned = cleaned.replace(/usb[- ]?c/gi, 'usbc');
        cleaned = cleaned.replace(/type[- ]?c/gi, 'typec');
        cleaned = cleaned.replace(/(\d+)\s*(gb|tb|ml|mg|lt|mm|mah|hz|dpi|''|")/g, '$1$2');

        // C. Sembol ve gereksiz karakter temizliği (Model kodları için Tire (-) korunur)
        cleaned = cleaned.replace(/[^\w\s\u00C0-\u017FöçşığüÖÇŞİĞÜ-]/gi, ' ');

        // D. Akıllı Kelime Seçimi
        let words = cleaned.split(/\s+/).filter(w => {
            if (w.length > 1) return true;
            if (/\d/.test(w)) return true;
            return false;
        });

        // E. Model Kodu (Jackpot) Ayıklama ve Önceliklendirme
        // En az 6 karakterli, hem harf hem rakam içeren kelimeleri (örn: 82XM00PVTX) öncelikli say.
        const modelCodeIndex = words.findIndex(w => w.length >= 6 && /[a-z]/i.test(w) && /\d/.test(w));
        let prioritizedWords = [...words];

        if (modelCodeIndex > -1) {
            const modelCode = prioritizedWords.splice(modelCodeIndex, 1)[0];
            prioritizedWords.unshift(modelCode); // Model kodunu en başa al
        }

        // İlk 5 kelime + içinde rakam olan tüm yan detayları al
        const core = prioritizedWords.slice(0, 5);
        const details = prioritizedWords.slice(5).filter(w => /\d/.test(w));

        return [...core, ...details].slice(0, 10).join(' ').trim();
    }
};

/**
 * Cleans the product title to improve price search results.
 * Bridge function for compatibility.
 */
function cleanProductTitle(title) {
    const host = (typeof window !== 'undefined' && window.location) ? window.location.hostname : "";
    return Normalizer.clean(title, host);
}

/**
 * Debounce function to limit rate of function execution.
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Akakçe arama URL'i oluşturur.
 * Kategori tespit edilirse, kategori filtreli URL döner.
 * @param {string} rawTitle - Ham ürün başlığı (kategori tespiti için)
 * @param {string} searchQuery - Temizlenmiş arama sorgusu
 * @returns {string} - Akakçe arama URL'i
 */
function buildAkakceUrl(rawTitle, searchQuery) {
    const category = Normalizer.detectCategory(rawTitle);
    const encodedQuery = encodeURIComponent(searchQuery);

    if (category) {
        // Kategori bulunduysa, kategori filtreli URL
        // Format: https://www.akakce.com/islemci/?q=intel+core+i5+12600kf
        return `https://www.akakce.com/${category}/?q=${encodedQuery}`;
    } else {
        // Kategori bulunamadıysa, genel arama
        return `https://www.akakce.com/arama/?q=${encodedQuery}`;
    }
}
