const CACHE_DURATION = 1000 * 60 * 60 * 5; // 5 hours

const cache = new Map();

function get(videoId) {
    const item = cache.get(videoId);

    if (!item) return null;

    if (Date.now() > item.expiresAt) {
        cache.delete(videoId);
        return null;
    }

    return item.url;
}

function set(videoId, url) {
    cache.set(videoId, {
        url,
        expiresAt: Date.now() + CACHE_DURATION
    });
}

function remove(videoId) {
    cache.delete(videoId);
}

function clear() {
    cache.clear();
}

module.exports = {
    get,
    set,
    remove,
    clear
};