//
// client.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  var DSN_KEYS               = 'username password host port providerId'.split(' '),
      DSN_PATTERN            = /^([0-9a-z-]+):([0-9a-z-]+)@([0-9a-z-\.]+):([0-9]+)\/([0-9a-z-]+)$/i,
      DEVICE_ID_KEY          = 'com.thenewtricks.courage.deviceId',
      SUBSCRIBE_PROTOCOL_ID  = 1,
      REQUEST_MESSAGE_TYPE   = 0,
      STREAMING_MESSAGE_TYPE = 3;

  // The Courage Client is used to subscribe to streaming events from the Courage service.
  //
  // It is initially configured using a DSN, which contains authorization credentials, the location
  // of the service, and the id of the provider for this app.
  //
  // A DSN is structured as follows:
  //     {username}:{password}@{host}:{port}/{providerId}
  //
  // All fields are required. Here is an example:
  //     sessionid:sessionkey@rt.thenewtricks.com:9090/928308cd-eff8-4ef6-a154-f8268ec663d5
  //
  // The app can then use the `bind` method to subscribe to events from a channel:
  //     client.bind('28955ba1-fc5d-4553-9d1b-c751d5110c82', function(data) { console.log(data); });
  Courage.Client = function Client(dsn) {

    // Parse the DSN, get the persistent device id, and initialize a data structure
    // to map channel ids to callbacks.
    this._dsn = parseDSN(dsn);
    this._deviceId = persistentDeviceId();
    this._handlers = {};
    this._connectionManager = null;
  };
  
  Courage.Client.prototype = {

    bind: bind,

    _subscribeToChannel: subscribeToChannel,
    _onConnectionOpen: onConnectionOpen,
    _onConnectionMessage: onConnectionMessage,
  };

  // parseDSN converts a DSN string to its component parts.
  function parseDSN(dsn) {

    var parsed = {};
    var m = DSN_PATTERN.exec(dsn);
    // TODO: fail if pattern fails to match.
    // TODO: Validate auth strings length and valid parameters.

    for (var i = 0; i < DSN_KEYS.length; i++) {
      parsed[DSN_KEYS[i]] = m[i + 1] || '';
    }

    // Replace the providerId with a parsed version.
    parsed.providerId = TheNewTricks.UUID.parse(parsed.providerId);

    return parsed;
  }

  // persistentDeviceId returns a UUID unique to this browser.
  //
  // Each browser is identified by a persistent, unique UUID, even if they belong to the same
  // user. Retrieve the device id from local storage if it exists, or generate a new one.
  function persistentDeviceId() {

    var deviceId = TheNewTricks.UUID.parse(localStorage[DEVICE_ID_KEY]);
    if (!deviceId) {
      deviceId = TheNewTricks.UUID.generateV4();
      localStorage[DEVICE_ID_KEY] = TheNewTricks.UUID.unparse(deviceId);
    }

    return deviceId;
  }

  // The app can use the `bind` method of the Client to subscribe to events from a channel defined
  // by a channelId. All events that match that channelId will be fed to the callback function
  // registered with `bind`.
  //
  // Example:
  //     client.bind('28955ba1-fc5d-4553-9d1b-c751d5110c82', function(data) { console.log(data); });
  //
  // `data` is a Uint8Array.
  function bind(channelId, callback, options) {

    var options = options || {};

    // If the connection manager isn't started, start it now.
    if (!this._connectionManager) {

      var url = 'ws://' + this._dsn.host + ':' + this._dsn.port + '/';
      this._connectionManager = new Courage._ConnectionManager(url);

      this._connectionManager.onOpen = this._onConnectionOpen.bind(this);
      this._connectionManager.onMessage = this._onConnectionMessage.bind(this);

      this._connectionManager.start();
    }

    // Register the callback and options for events on the bound channel.
    this._handlers[channelId.toLowerCase()] = {
      replay: options.replay,
      callback: callback,
    };

    // If the connection manager is started and connected, subscribe right away. Otherwise no-op;
    // all channels will be subscribed to automatically when the connection is reopened.
    if (this._connectionManager.readyState() === WebSocket.OPEN) {

      var uuid = TheNewTricks.UUID.parse(channelId);
      this._subscribeToChannel(uuid, options.replay);
    }
  }

  // subscribeToChannel formats and send a subscribtion request for the specified channelId
  // to teh service.
  function subscribeToChannel(channelId, replay) {

      // Form the subscribe request.
      var request = new Courage._MessageBuffer(SUBSCRIBE_PROTOCOL_ID, REQUEST_MESSAGE_TYPE);

      request.writeString(this._dsn.username);
      request.writeString(this._dsn.password);
      request.writeUUID(this._dsn.providerId);
      request.writeUUID(channelId);
      request.writeUUID(this._deviceId);
      request.writeUint8(replay ? 1 : 0);

      // Send the subscribe request.
      this._connectionManager.send(request.buffer().buffer);
    }

  // onConnectionOpen, resubscribe to the channels we are bound to.
  function onConnectionOpen() {

    for (var channelId in this._handlers) {
      if (this._handlers.hasOwnProperty(channelId)) {

        var uuid = TheNewTricks.UUID.parse(channelId);
        this._subscribeToChannel(uuid, this._handlers[channelId].replay);
      }
    }
  }

  // onConnectionMessage, deliver streaming events to each of the callbacks bound to a channel id.
  function onConnectionMessage(event) {

    var parser = new Courage._MessageParser(event.data);

    // Discard messages with unrecognized headers.
    var header = parser.readHeader();
    if (header.protocol !== SUBSCRIBE_PROTOCOL_ID || header.messageType !== STREAMING_MESSAGE_TYPE) {
      return;
    }

    // Parse the channel id and get the registered callback.
    var channelId = parser.readUUID();
    var callback = this._handlers[TheNewTricks.UUID.unparse(channelId)].callback;

    // For each event, deliver the event data.
    var numEvents = parser.readUint8();
    for (var i = 0; i < numEvents; i++) {
      var data = parser.readBlob();
      callback(data);
    }
  }

  return Courage;

})(TheNewTricks.Courage || {});
