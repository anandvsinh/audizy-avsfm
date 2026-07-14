const ytdlp = require("yt-dlp-exec");
const axios = require("axios");
const Cache = require("./cacheService");

async function getStreamUrl(videoId, req, res){
    const url = `https://music.youtube.com/watch?v=${videoId}`;     //Constructing the YouTube Music URL for the given videoId

    const cachedUrl = Cache.get(videoId);        //Checking if the stream URL is already cached
    if(cachedUrl){
        console.log("[CACHE] HIT:", videoId);
        return cachedUrl;
    }

    const streamUrl = await ytdlp(url,{     //Getting the stream URL using yt-dlp
            format: "ba",
            getUrl: true
        });

    Cache.set(videoId, streamUrl);      //Saving the stream URL in cache for future requests
    console.log("[CACHE] STORED:",videoId);

    const range = req.headers.range;

    const headers = {};
    if(range){
        headers.Range = range;
    }
    
    const response = await axios({      //Making a GET request to the stream URL with the appropriate headers
        url: streamUrl.trim(),
        method: "GET",
        responseType: "stream",
        headers
    });

//Headers*
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

module.exports = {      //Exporting the getStreamUrl function for use in other modules
    getStreamUrl
};