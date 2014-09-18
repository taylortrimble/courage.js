//
// connection_manager.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  var INITIAL_TIMEOUT_INTERVAL =    100,    // 100 ms.
      CEILING_TIMEOUT_INTERVAL = 300000;    // 5 min.

  // The ConnectionManager connects to a service over a WebSocket.
  //
  // It can send and receive binary messages.
  // If the connection is lost, the ConnectionManager uses an exponential backoff strategy
  // to reconnect to the service.
  //
  // The ConnectionManager is started with a WebSocket URL and the `start` method:
  //     var connectionManager = new ConnectionManager('ws://rt.thenewtricks.com:9090/');
  //     connectionManager.start();
  //
  // Care should be taken so the connectionManager is only started once. Otherwise, the
  // connection manager may try to connect more than once.
  //
  // Messages can be sent with `send`:
  //     connectionManager.send(data);
  //
  // The following callbacks exist:
  //   - onOpen
  //   - onMessage
  //   - onError
  Courage._ConnectionManager = function ConnectionManager(url) {

    // Public members.
    this.onOpen    = function(){};
    this.onMessage = function(){};
    this.onError   = function(){};

    // Private members.
    this._url = url;
    this._connection = null;
    this._timer = null;
    this._interval = INITIAL_TIMEOUT_INTERVAL;
  };

  Courage._ConnectionManager.prototype = {

    start: start,
    readyState: readyState,
    send: send,

    _onWebSocketOpen: onWebSocketOpen,
    _onWebSocketClose: onWebSocketClose,
    _onWebSocketMessage: onWebSocketMessage,
    _onWebSocketError: onWebSocketError,
  };

  // readyState returns the readyState of the underlying WebSocket. If there is
  // no underlying WebSocket, it returns CONNECTING.
  function readyState() {
    return this._connection.readyState;
  }

  // send sends binary data over the WebSocket connection.
  function send(data) {
    this._connection.send(data);
  }

  // start attempts to open a new WebSocket.
  //
  // The WebSocket is configured with the appropriate callbacks to enable reconnection
  // and calling the ConnectionManager's callback functions.
  function start() {

    this._connection = new WebSocket(this._url);
    this._connection.binaryType = 'arraybuffer';
    this._connection.onopen = this._onWebSocketOpen.bind(this);
    this._connection.onclose = this._onWebSocketClose.bind(this);
    this._connection.onmessage = this._onWebSocketMessage.bind(this);
    this._connection.onerror = this._onWebSocketError.bind(this);
  }

  // onWebSocketOpen, mark the connection as connected and clear the retry timer.
  function onWebSocketOpen() {

    clearTimeout(this._timer);
    this._interval = INITIAL_TIMEOUT_INTERVAL;

    this.onOpen();
  }

  // onWebSocketclose, mark the connection as disconnected and start the retry timer
  // with an exponentially increasing interval with a ceiling.
  function onWebSocketClose(event) {

    this._timer = setTimeout(this.start.bind(this), this._interval);

    // Calculate next timeout interval. Exponential backoff with ceiling.
    this._interval = this._interval * 2;
    this._interval = Math.min(this._interval, CEILING_TIMEOUT_INTERVAL);
  }

  // onWebSocketMessage, pass the message on to the callback.
  function onWebSocketMessage(event) {
    this.onMessage(event);
  }

  // onWebSocketError, pass the error on to the callback.
  function onWebSocketError(error) {
    this.onError(error);
  }

  return Courage;

})(TheNewTricks.Courage || {});
