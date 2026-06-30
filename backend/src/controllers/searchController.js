const { searchSongs } = require("../services/searchService");

async function search(req, res) {
    const query = req.query.q;
    const songs = await searchSongs(query);
    res.json(songs);
}

module.exports = { 
    search
};
