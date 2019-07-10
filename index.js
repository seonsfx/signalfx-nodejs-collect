'use strict';

const SignalFxSender = require('./utils/signalfx-sender');
const collect = require('./collect');
const middleware = require('./middleware');

module.exports = class SignalFxCollect {
  constructor(config) {
    if (!config) {
      throw "Config";
    }
    if (!config.accessToken) {
      throw "accessToken";
    }

    this.accessToken = config.accessToken;
  }

  start() {
    this.sender = new SignalFxSender(this.accessToken);

    this._startCollectLoop(3000);
    this._registerEventHandlers();
  }

  getMiddleware(framework) {
    switch (framework) {
      case 'express':
        return middleware.express(metrics => this.sender.send(metrics));
    }
    console.error(`${framework} is not supported.`);
  }

  _startCollectLoop(interval) {
    setInterval(() => {
      this.sender.send(collect.collect());
    }, interval);
  }

  _registerEventHandlers() {
    collect.registerEvent('gc');
    collect.registerEvent('memleak');

    collect.getEmitter().on('metrics', metrics => this.sender.send(metrics));
  }
}
