const { Innertube } = require("youtubei.js");

(async () => {
    const yt = await Innertube.create();

    const results = await yt.music.search("Believer");

    for (let i = 1; i < results.contents.length; i++) {
        console.log("\n========== SECTION", i, "==========");

        const section = results.contents[i];

        console.log("Section type:", section.type);

        console.dir(section.contents?.[0], { depth: 2 });
    }
})();