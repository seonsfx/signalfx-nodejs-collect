'use strict'

module.exports = {
    cpuUsage: () => {

    },
    eventLoop: () => {

    },
    gc: (gcStats) => {
        console.log(gcStats);
    },
    memoryLeak: (leak) => {
        console.log(leak);
    }
};