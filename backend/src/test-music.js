const { Innertube } = require("youtubei.js");

(async () => {
    const yt = await Innertube.create();

    console.dir(yt.music, { depth: 3 });
})();