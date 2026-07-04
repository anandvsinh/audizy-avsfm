const ytdlp = require("yt-dlp-exec");
const axios = require("axios");

async function getStreamUrl(videoId, req, res){
    const url = `https://youtube.com/watch?v=${videoId}`;

    const streamUrl = await ytdlp(url,{
            format: "ba",
            getUrl: true
        });

    const range = req.headers.range;

    const headers = {};
    if(range){
        headers.Range = range;
    }
    
    const response = await axios({
        url: streamUrl.trim(),
        method: "GET",
        responseType: "stream",
        headers
    });

    if(response.headers["content-type"]){
        res.setHeader("Content-Type", response.headers["content-type"]);
    }

    if(response.headers["content-length"]){
        res.setHeader("Content-Length", response.headers["content-length"]);
    }

    if(response.headers["accept-ranges"]){
        res.setHeader("Accept-Ranges", response.headers["accept-ranges"]);
    }

    if(response.headers["content-range"]){
        res.setHeader("Content-Range", response.headers["content-range"]);
    }

    res.status(response.status);
    response.data.pipe(res);
}

module.exports = {
    getStreamUrl
};