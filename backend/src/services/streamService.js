const ytdlp = require("yt-dlp-exec");
const axios = require("axios");
const Cache = require("./cacheService");

async function getStreamUrl(videoId, req, res){
    const url = `https://music.youtube.com/watch?v=${videoId}`;     //Constructing the YouTube Music URL for the given videoId

    let streamUrl = Cache.get(videoId);         //imports cached url

    if(streamUrl){
        console.log("[CACHE} HIT:", videoId);
    }
    else{
        streamUrl = await ytdlp(url,{           //calls yt-dlp for url if url not cached already
            format:"ba",
            getUrl:true
        });
        
        Cache.set(videoId, streamUrl);

        console.log("[CACHE] STORED:",videoId);     //stores the new streamUrl in cache
    }

    const range = req.headers.range;

    const headers = {};
    if(range){
        headers.Range = range;
    }
    
    let response;

    try{
        response = await axios({
            url: streamUrl.trim(),
            method: "GET",
            responseType: "stream",
            headers
        });
    }

    catch (err){
        Cache.remove(videoId);
        console.log("[CACHE] REMOVED:", videoId);

        streamUrl = await ytdlp(url, {
            format: "ba",
            getUrl: true
        });
        
        Cache.set(videoId, streamUrl);

        response = await axios({
            url: streamUrl.trim(),
            method: "GET",
            responseType: "stream",
            headers
        });
    }

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