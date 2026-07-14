const { getYoutube } = require("../utils/youtubeClient");

async function searchSongs(query){              //Searching for songs on YouTube Music using the provided query
    const youtube = await getYoutube();
    const search = await youtube.search(`${query} official`);

    const video = search.results                //Search results are filtered to include only videos, Only 5 search results are returned for a faster response.
        .filter(item => item.type === "Video")
        .slice(0, 5)
        .map(video => ({
            videoId: video.video_id,
            title: video.title.text,
            channel: video.author.name,
            thumbnail: video.thumbnails[0].url,
            duration: video.length_text?.text || "Unknown Artist"
        }));

    return video;
}

module.exports = {
    searchSongs
};