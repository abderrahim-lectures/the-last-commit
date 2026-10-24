(function () {
  "use strict";

  function EventEmitter() {
    this._events = Object.create(null);
  }

  EventEmitter.prototype.on = function (event, fn, context) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    var list = this._events[event];
    if (!list) {
      list = this._events[event] = [];
    }
    list.push({ fn: fn, context: context, once: false });
    return this;
  };

  EventEmitter.prototype.once = function (event, fn, context) {
    if (typeof fn !== "function") {
      throw new TypeError("The listener must be a function");
    }
    var emitter = this;
    var wrapper = function () {
      emitter.off(event, wrapper, context);
      return fn.apply(context, arguments);
    };
    wrapper.listener = fn;
    return this.on(event, wrapper, context);
  };

  EventEmitter.prototype.off = function (event, fn, context) {
    var list = this._events[event];
    if (!list) {
      return this;
    }
    if (!fn) {
      delete this._events[event];
      return this;
    }
    this._events[event] = list.filter(function (entry) {
      if (entry.fn !== fn && entry.fn.listener !== fn) {
        return true;
      }
      return context !== undefined && entry.context !== context;
    });
    if (this._events[event].length === 0) {
      delete this._events[event];
    }
    return this;
  };

  EventEmitter.prototype.emit = function (event) {
    var list = this._events[event];
    if (!list || list.length === 0) {
      return false;
    }
    var args = Array.prototype.slice.call(arguments, 1);
    var snapshot = list.slice();
    for (var i = 0; i < snapshot.length; i += 1) {
      var entry = snapshot[i];
      if (entry.once) {
        this.off(event, entry.fn, entry.context);
      }
      entry.fn.apply(entry.context, args);
    }
    return true;
  };

  EventEmitter.prototype.removeAllListeners = function (event) {
    if (event === undefined) {
      this._events = Object.create(null);
    } else {
      delete this._events[event];
    }
    return this;
  };

  EventEmitter.prototype.listeners = function (event) {
    var list = this._events[event] || [];
    return list.map(function (entry) {
      return entry.fn.listener || entry.fn;
    });
  };

  EventEmitter.prototype.listenerCount = function (event) {
    var list = this._events[event];
    return list ? list.length : 0;
  };

  EventEmitter.prototype.eventNames = function () {
    return Object.keys(this._events);
  };

  var bus = new EventEmitter();
  window.__python101Bus = bus;
  window.__webgl = window.__webgl || {};
  window.__webgl.events = bus;
})();
