//
// connection_manager.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // Class private container.
  var Private = Courage._private = Courage._private || {};

  var INITIAL_TIMEOUT_INTERVAL =    100,    // 100 ms.
      CEILING_TIMEOUT_INTERVAL = 300000;    // 5 min.

  Private.ConnectionManager = function ConnectionManager(url) {

    // Public members.
    this.connected = false;
    this.onopen    = function(){};
    this.onmessage = function(){};
    this.onerror   = function(){};

    // Private members.
    var my = this._private_vars = {};

    my.url = url;
    my.started = false;
    my.connection = null;
    my.timer = null;
    my.interval = INITIAL_TIMEOUT_INTERVAL;
  };

  Private.ConnectionManager.prototype = {

    start: function start() {

      // Access to private members.
      var my = this._private_vars;
      var helpers = this._private_methods;

      // If we have an active connection, we're already started.
      if (my.started) {
        return;
      }

      my.started = true;

      helpers.connect.bind(this)();
    },

    send: function send(data) {

      // Access to private members.
      var my = this._private_vars;
      var helpers = this._private_methods;

      my.connection.send(data);
    },

    _private_methods: {

      connect: function connect() {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        my.connection = new WebSocket(my.url);
        my.connection.binaryType = 'arraybuffer';
        my.connection.onopen = helpers.onWebSocketOpen.bind(this);
        my.connection.onclose = helpers.onWebSocketClose.bind(this);
        my.connection.onmessage = helpers.onWebSocketMessage.bind(this);
        my.connection.onerror = helpers.onWebSocketError.bind(this);
      },

      onWebSocketOpen: function onWebSocketOpen() {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        this.connected = true;

        clearTimeout(my.timer);
        my.interval = INITIAL_TIMEOUT_INTERVAL;

        this.onopen();
      },

      onWebSocketClose: function onWebSocketClose(event) {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        this.connected = false;

        my.timer = setTimeout(helpers.connect.bind(this), my.interval);

        // Calculate next timeout interval. Exponential backoff with ceiling.
        my.interval = my.interval * 2;
        my.interval = Math.min(my.interval, CEILING_TIMEOUT_INTERVAL);
      },

      onWebSocketMessage: function onWebSocketMessage(event) {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        this.onmessage(event);
      },

      onWebSocketError: function onWebSocketError(error) {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        this.onerror(error);
      },
    },
  };

  return Courage;

})(TheNewTricks.Courage || {});
