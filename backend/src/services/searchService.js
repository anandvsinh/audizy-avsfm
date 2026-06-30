const ytdlp = require("yt-dlp-exec");

function searchSongs(query){
    
    const result = await ytdlp(
        `ytsearch10:${query}`,
        {
            dumpSingleJson: true
        }
    );

    return result.entries.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.channel,
        duration: song.duration,
        thumbnail: song.thumbnail,
        views: song.view.count
    }));
}

module.exports = {
    searchSongs
};