'use strict'

const eventLoopStats = require('event-loop-stats');
const gc = (require('gc-stats'))();
const memwatch = require('memwatch-next');
const cpuUsage = require('./utils/cpu-usage');
const memoryUsage = require('./utils/memory-usage');
const SignalFxSender = require('./utils/signalfx-sender');

const adapters = require('./adapters');

module.exports = class SignalFxCollect {
    start(config) {
        this.sender = new SignalFxSender("ORG_TOKEN");

        this._startCollectLoop(3000);
        this._registerEventHandlers();
    }

    getMiddleware(framework) {
        switch (framework) {
            case 'express':
                return this._getExpressMiddleware();
        }
        console.error(`${framework} is not supported`);
    }

    _startCollectLoop(interval) {
        setInterval(() => {
            let metrics = [];

            metrics.push(adapters.cpuUsage(cpuUsage()));
            metrics.push(adapters.memoryUsage(memoryUsage()));
            metrics.push(adapters.eventLoop(eventLoopStats.sense()));

            this.sender.send(metrics);
        }, interval);
    }

    _registerEventHandlers() {
        gc.on('stats', stats => {
            this.sender.send(adapters.gc(stats));
        });
        memwatch.on('leak', info => {
            this.sender.send(adapters.memoryLeak(info));
        });
    }

    _getExpressMiddleware() {
        let reqTimestamp;
        return (req, res, next) => {
            reqTimestamp = Date.now();

            res.once('finish', function () {
                let resTimestamp = Date.now();
                console.log("latency is " + (resTimestamp - reqTimestamp));
            });
            
            next();
        };
    }
}
