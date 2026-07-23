const { searchSongs } = require("../services/youtubeMusic");

async function search(req, res) {
    const query = req.query.q;
    const songs = await searchSongs(query);
    res.json({
        query,
        results: songs
    });
}

module.exports = {
    search
};
