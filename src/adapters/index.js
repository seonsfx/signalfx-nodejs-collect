'use strict';

const fqdn = require('fqdn');

const METRIC_FAMILY = 'nodejs';
const METRIC_SOURCE = 'nodejs-collect';
const GC_TYPE = [
  null, "Scavange", "Mark/Sweep/Compact", null,
  "IncrementalMarking", null, null, null,
  "ProcessWeakCallbacks", null, null, null,
  null, null, null, "All"
];

let basicDimensions = {
  host: fqdn(),
  metric_source: METRIC_SOURCE
};

module.exports = {
  cpuUsage: usage => {
    const prefix = `${METRIC_FAMILY}.cpu.utilization`;
    const timestamp = Date.now();
    return [
      getMetricObject('gauge', `${prefix}.system`, usage.system, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.user`, usage.user, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.total`, usage.total, timestamp, basicDimensions)
    ];
  },
  memoryUsage: usage => {
    const prefix = `${METRIC_FAMILY}.memory`;
    const timestamp = Date.now();
    return [
      getMetricObject('gauge', `${prefix}.system.total`, usage.system.total, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.system.free`, usage.system.free, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.heap.total`, usage.process.heapTotal, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.heap.used`, usage.process.heapUsed, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.rss`, usage.process.rss, timestamp, basicDimensions)
    ];
  },
  eventLoop: stats => {
    const prefix = `${METRIC_FAMILY}.event_loop`;
    const timestamp = Date.now();
    return [
      getMetricObject('gauge', `${prefix}.max`, stats.max, timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.min`, stats.min, timestamp, basicDimensions)
    ];
  },
  gc: stats => {
    const prefix = `${METRIC_FAMILY}.memory.gc`;
    // gc-stats provides startTime but it is in node process.hrtime() so can't use.
    const timestamp = Date.now();
    const dimensions = Object.assign({}, basicDimensions, {
      gctype: GC_TYPE[stats.gctype]
    });
    return [
      getMetricObject('gauge', `${prefix}.size`, stats.diff.totalHeapSize, timestamp, dimensions),
      getMetricObject('gauge', `${prefix}.pause`, stats.pause, timestamp, dimensions)
    ];
  },
  memoryLeak: stats => {
    return [
      getMetricObject('gauge', `${METRIC_FAMILY}.memory.heap.leak`, stats.growth, Date.now(), basicDimensions)
    ];
  },
  http: request => {
    const prefix = `${METRIC_FAMILY}.http`;
    return [
      getMetricObject('counter', `${prefix}.rq_total`, 1, request.timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.rq_time`, request.time, request.timestamp, basicDimensions),
      getMetricObject('counter', `${prefix}.rq_${request.status}`, 1, request.timestamp, basicDimensions),
      getMetricObject('gauge', `${prefix}.rq_size`, request.size, request.timestamp, basicDimensions)
    ];
  },
  addBasicDimensions: dimensions => {
    Object.assign(basicDimensions, dimensions);
  }
};

function getMetricObject(type, metric, value, timestamp, dimensions) {
  let obj = {
    type,
    metric,
    value,
    timestamp
  };
  if (dimensions) {
    obj.dimensions = dimensions;
  }
  return obj;
}
