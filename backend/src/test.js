const { Innertube } = require("youtubei.js");

(async () => {

    const youtube = await Innertube.create();

    const results = await youtube.search("Believer");

    console.log(results.results[0]);

})();