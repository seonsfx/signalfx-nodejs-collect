'use strict'

const signalfx = require('signalfx');

module.exports = class SignalFxSender {
    constructor(token) {
        this.client = new signalfx.Ingest(token);
    }

    send(metrics) {
        let cumulative_counters = [];
        let gauges = [];
        let counters = [];

        for (let i = 0; i < metrics.length; i++) {
            switch (metrics[i].type) {
                case 'cumulative_counters':
                    cumulative_counters.push(convertMetric(metrics[i]));
                    break;
                case 'gauges':
                    gauges.push(convertMetric(metrics[i]));
                    break;
                case 'counters':
                    counters.push(convertMetric(metrics[i]));
                    break;
            }
        }

        this.client.send({
            cumulative_counters,
            gauges,
            counters
        });
    }
}

function convertMetric(metric) {
    return {
        metric: metric.metric,
        value: metric.value,
        timestamp: metric.timestamp,
        dimensions: metric.dimensions
    };
}