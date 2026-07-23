//==Queue Management System==//

const Queue = (() => {
    let currentTrack = null;
    let upcoming = [];
    let history = [];
    let shuffle = false;
    let repeat = "off";

    function play(track) {
        if (!track) return null;

        if (currentTrack && currentTrack.videoId !== track.videoId) {
            history.push(currentTrack);
        }
        currentTrack = track;
        notify();
        return currentTrack;
    }

    function add(track) {
        if (!track) return;
        upcoming.push(track);
        notify();
    }

    function playNext(track) {
        if (!track) return;
        upcoming.unshift(track);
        notify();
    }

    function next() {
        if (repeat === "one" && currentTrack) {
            return currentTrack;
        }
        if (upcoming.length === 0) {
            if (repeat === "all" && history.length > 0) {
                upcoming = [...history];
                history = [];
            }
            else {
                currentTrack = null;
                notify();
                return null;
            }
        }
        if (currentTrack) {
            history.push(currentTrack);
        }
        currentTrack = upcoming.shift();
        notify();
        return currentTrack;
    }

    function previous() {
        if (history.length === 0) {
            return currentTrack;
        }
        if (currentTrack) {
            upcoming.unshift(currentTrack);
        }

        currentTrack = history.pop();
        notify();
        return currentTrack;
    }

    function remove(index) {
        if (index < 0 || index >= upcoming.length) {
            return;
        }

        upcoming.splice(index, 1);
        notify();
    }

    function clear() {
        upcoming = [];
        history = [];
        notify();
    }

    function setShuffle(enabled) {
        shuffle = enabled;
        notify();
    }

    function setRepeat(mode) {
        repeat = mode;
        notify();
    }

    function getCurrent() {
        return currentTrack;
    }

    function getUpcoming() {
        return [...upcoming];
    }

    function getHistory() {
        return [...history];
    }

    function getState() {
        return {
            currentTrack,
            upcoming: [...upcoming],
            history: [...history],
            shuffle,
            repeat
        };
    }

    function notify() {
        document.dispatchEvent(
            new CustomEvent("queuechange", {
                detail: getState()
            })
        );
    }

    return {
        play,
        add,
        playNext,
        next,
        previous,
        remove,
        clear,
        setShuffle,
        setRepeat,
        getCurrent,
        getUpcoming,
        getHistory,
        getState
    };
})();