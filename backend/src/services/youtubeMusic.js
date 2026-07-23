const { getYoutube } = require("../utils/youtubeClient");

async function searchSongs(query) {
    const yt = await getYoutube();
    const results = await yt.search(query, {
        type: "song"
    });

    return results.results.map(song => ({
        videoId: song.id || song.video_id,
        title: song.title?.text || song.title,
        channel: song.author?.name || song.artists?.[0]?.name || "Unknown Artist",
        thumbnail: song.thumbnails?.at(-1)?.url || "",
        duration: song.duration?.text || song.duration || ""
    }));
}

module.exports = {
    searchSongs
};