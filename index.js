'use strict'

const eventLoopStats = require('event-loop-stats');
const simpleStatsServer = require('simple-stats-server');
const stats = simpleStatsServer();
const gc = (require('gc-stats'))();
const memwatch = require('memwatch-next');
const cpuUsage = require('./utils/cpu-usage');
const SignalFxSender = require('./utils/signalfx-sender');

const adapters = require('./adapters');

module.exports = class SignalFxCollect {
    start(config) {
        this.sender = new SignalFxSender("ORG_TOKEN");

        this._startCollectLoop(3000);
        this._registerEventHandlers();
    }

    getMiddleware() {
        console.log('express middleware');
        return this._getExpressMiddleware();
    }

    _startCollectLoop(interval) {
        setInterval(() => {
            let metrics = [];

            metrics.push(adapters.cpuUsage(cpuUsage()));
            metrics.push(adapters.eventLoop(eventLoopStats.sense()));
            // TODO : handle memory in-house

            stats.get('/memory', (err, result) => {
                console.log(result);
            });

            this.sender.send(metrics);
        }, interval);
    }

    _registerEventHandlers() {
        gc.on('stats', stats => {
            console.log('GC!');
            this.sender.send(adapters.gc(stats));
        });

        memwatch.on('leak', info => {
            console.log('Leak!');
            this.sender.send(adapters.memoryLeak(info));
        });

    }

    _getExpressMiddleware() {
        let reqTimestamp;
        return (req, res, next) => {
            reqTimestamp = new Date();
            res.once('finish', function() {
                let resTimestamp = new Date();
                console.log("latency is " + (resTimestamp.getTime() - reqTimestamp.getTime()));
            });
            next();
        };
    }
}
