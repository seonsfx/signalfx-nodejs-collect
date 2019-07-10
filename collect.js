'use strict';

const eventLoopStats = require('event-loop-stats');
const gc = (require('gc-stats'))();
const memwatch = require('memwatch-next');

const cpuUsage = require('./utils/cpu-usage');
const memoryUsage = require('./utils/memory-usage');
const adapters = require('./adapters');

const emitter = new (require('events').EventEmitter)();

module.exports = {
  collect: () => {
    let metrics = [];

    let cpu = cpuUsage();
    if (cpu) {
      metrics = metrics.concat(adapters.cpuUsage(cpuUsage()));
    }

    let mem = memoryUsage();
    if (mem) {
      metrics = metrics.concat(adapters.memoryUsage(mem));
    }

    let el = eventLoopStats.sense();
    if (el) {
      metrics = metrics.concat(adapters.eventLoop(el));
    }

    return metrics;
  },
  registerEvent: event => {
    switch (event) {
      case 'gc':
        gc.on('stats', stats => {
          emitter.emit('metrics', adapters.gc(stats));
        });
        break;
      case 'memleak':
        memwatch.on('leak', info => {
          emitter.emit('metrics', adapters.memoryLeak(info));
        });
        break;
    }
  },
  getEmitter: () => emitter
}
