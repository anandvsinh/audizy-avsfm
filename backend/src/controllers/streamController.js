const { getStreamUrl } = require("../services/streamService");

async function stream(req, res) {
    
    try{
        const videoId = req.query.id;
        await getStreamUrl(videoId, req, res);
    }
    catch (err){
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Streaming failed. {error101:audio not found}"
        });
    }
}

module.exports = {
    stream
};