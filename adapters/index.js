'use strict';

const METRIC_FAMILY = 'nodejs'
const GC_TYPE = [
  null, "Scavange", "Mark/Sweep/Compact", null,
  "IncrementalMarking", null, null, null,
  "ProcessWeakCallbacks", null, null, null,
  null, null, null, "All"
];

module.exports = {
  cpuUsage: usage => {
    const prefix = `${METRIC_FAMILY}.cpu.utilization`;
    const timestamp = Date.now();
    return [
      getMetricObject('gauge', `${prefix}.system`, usage.system, timestamp),
      getMetricObject('gauge', `${prefix}.user`, usage.user, timestamp),
      getMetricObject('gauge', `${prefix}.total`, usage.total, timestamp)
    ];
  },
  memoryUsage: usage => {
    const prefix = `${METRIC_FAMILY}.memory`;
    const timestamp = Date.now();
    return [
      getMetricObject('gauge', `${prefix}.system.total`, usage.system.total, timestamp),
      getMetricObject('gauge', `${prefix}.system.free`, usage.system.free, timestamp),
      getMetricObject('gauge', `${prefix}.heap.total`, usage.process.heapTotal, timestamp),
      getMetricObject('gauge', `${prefix}.heap.used`, usage.process.heapUsed, timestamp),
      getMetricObject('gauge', `${prefix}.rss`, usage.process.rss, timestamp)
    ];
  },
  eventLoop: stats => {
    const prefix = `${METRIC_FAMILY}.event_loop`;
    const timestamp = Date.now();
    return [
      getMetricObject('gauge', `${prefix}.max`, stats.max, timestamp),
      getMetricObject('gauge', `${prefix}.min`, stats.min, timestamp)
    ];
  },
  gc: stats => {
    const prefix = `${METRIC_FAMILY}.memory.gc`;
    // gc-stats provides startTime but it is in node process.hrtime() so can't use.
    const timestamp = Date.now();
    const dimensions = {
      gctype: GC_TYPE[stats.gctype]
    };
    return [
      getMetricObject('gauge', `${prefix}.size`, stats.diff.totalHeapSize, timestamp, dimensions),
      getMetricObject('gauge', `${prefix}.pause`, stats.pause, timestamp, dimensions)
    ];
  },
  memoryLeak: stats => {
    return [
      getMetricObject('gauge', 'nodejs.memory.heap.leak', stats.growth, Date.now())
    ];
  },
  http: request => {
    const prefix = `${METRIC_FAMILY}.http`;
    return [
      getMetricObject('counter', `${prefix}.rq_total`, 1, request.timestamp),
      getMetricObject('gauge', `${prefix}.rq_time`, request.time, request.timestamp),
      getMetricObject('counter', `${prefix}.rq_${request.status}`, 1, request.timestamp),
      getMetricObject('gauge', `${prefix}.rq_size`, request.size, request.timestamp)
    ];
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