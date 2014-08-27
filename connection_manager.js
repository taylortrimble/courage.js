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

  // The ConnectionManager connects to a service over a WebSocket.
  //
  // It can send and receive binary messages.
  // If the connection is lost, the ConnectionManager uses an exponential backoff strategy
  // to reconnect to the service.
  //
  // The ConnectionManager is started with a WebSocket URL:
  //     var connectionManager = new ConnectionManager('ws://rt.thenewtricks.com:9090/');
  //
  // It can then be started with `start`:
  //     connectionManager.start();
  //
  // Messages can be sent with `send`:
  //     connectionManager.send(data);
  //
  // The following callbacks exist:
  //   - onopen
  //   - onmessage
  //   - onerror
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

    // `start` starts the ConnectionManager.
    //
    // Start may be called multiple times. The connection manager will only be started once,
    // and cannot be stopped.
    start: function start() {

      // Access to private members.
      var my = this._private_vars;
      var helpers = this._private_methods;

      // Return if we've already started.
      if (my.started) {
        return;
      }

      my.started = true;

      helpers.connect.bind(this)();
    },

    // `send` sends binary data over the WebSocket connection.
    send: function send(data) {

      // Access to private members.
      var my = this._private_vars;
      var helpers = this._private_methods;

      my.connection.send(data);
    },

    _private_methods: {

      // `connect` attempts to open a new WebSocket.
      //
      // The WebSocket is configured with the appropriate callbacks to enable reconnection
      // and calling the ConnectionManager's callback functions.
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

      // Mark the connection as connected and clear the retry timer.
      onWebSocketOpen: function onWebSocketOpen() {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        this.connected = true;

        clearTimeout(my.timer);
        my.interval = INITIAL_TIMEOUT_INTERVAL;

        this.onopen();
      },

      // Mark the connection as disconnected and start the retry timer
      // with an exponentially increasing interval with a ceiling.
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

      // Pass the message on to the callback.
      onWebSocketMessage: function onWebSocketMessage(event) {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        this.onmessage(event);
      },

      // Pass the error on to the callback.
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
