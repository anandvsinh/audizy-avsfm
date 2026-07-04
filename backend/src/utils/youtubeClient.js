const { Innertube } = require("youtubei.js");

let youtube = null;

async function getYoutube(){
    if(!youtube){
        youtube = await Innertube.create();
    }
    return youtube;
}

module.exports = {
    getYoutube
};