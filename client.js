//
// client.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // Class private container.
  var PrivateCourage = Courage._private = Courage._private || {};

  var DSN_KEYS      = 'username password host port providerId'.split(' '),
      DSN_PATTERN   = /^([0-9a-z-]+):([0-9a-z-]+)@([0-9a-z-\.]+):([0-9]+)\/([0-9a-z-]+)$/i,
      DEVICE_ID_KEY = 'com.thenewtricks.courage.deviceId';

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

    // Parse the DSN, get the persistent device id, and initialize a data structure to map channel ids
    // to callbacks. Store as private members.
    this._private = {
      dsn: parseDSN(dsn),
      deviceId: persistentDeviceId(),
      handlers: {},
      connectionManager: null,
    };
  };
  
  Courage.Client.prototype = {

    // The app can use the `bind` method of the Client to subscribe to events from a channel defined
    // by a channelId. All events that match that channelId will be fed to the callback function
    // registered with `bind`.
    //
    // Example:
    //     client.bind('28955ba1-fc5d-4553-9d1b-c751d5110c82', function(data) { console.log(data); });
    //
    // `data` is an ArrayBuffer.
    bind: function bind(channelId, callback) {

      // Access to private members.
      var my = this._private;

      my.handlers[channelId.toLowerCase()] = callback;

      // If we haven't started the connection manager, start it now. The new channel will be
      // subscribed to automatically.
      //
      // Otherwise, if we're connected, subscribe right away. If we're started and not connected,
      // then no-op; all channels get subscribed to automatically when the connection is reopened.
      if (!my.connectionManager) {

        var url = 'ws://' + my.dsn.host + ':' + my.dsn.port + '/';
        my.connectionManager = new PrivateCourage.ConnectionManager(url);

        my.connectionManager.onopen = onConnectionOpen.bind(this);
        my.connectionManager.onmessage = onConnectionMessage.bind(this);

      } else if (my.connectionManager.connected) {

        var uuid = TheNewTricks.UUID.parse(channelId);
        subscribeToChannel.bind(this)(uuid);

      }
    },
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

    parsed.providerId = TheNewTricks.UUID.parse(parsed.providerId);

    return parsed;
  }

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

  function subscribeToChannel(channelId) {

      // Access to private members.
      var my = this._private;

      // Form the subscribe request.
      var request = new PrivateCourage.MessageBuffer(1, 0);

      request.writeString(my.dsn.username);
      request.writeString(my.dsn.password);
      request.writeUUID(my.dsn.providerId);
      request.writeUUID(channelId);
      request.writeUUID(my.deviceId);
      request.writeUint8(0);

      // Send the subscribe request.
      my.connectionManager.send(request.buffer().buffer);
    }

  function onConnectionOpen() {

    // Access to private members.
    var my = this._private;

    // Subscribe to each channel we are bound to.
    for (var channelId in my.handlers) {
      if (my.handlers.hasOwnProperty(channelId)) {

        var uuid = TheNewTricks.UUID.parse(channelId);
        subscribeToChannel.bind(this)(uuid);
      }
    }
  }

  function onConnectionMessage(event) {

    // Access to private members.
    var my = this._private;

    var parser = new PrivateCourage.MessageParser(event.data);

    // Discard messages with unrecognized headers.
    var header = parser.readHeader();
    if (header.protocol != 1 || header.messageType != 3) {
      return;
    }

    // Parse the channel id and get the registered callback.
    var channelId = parser.readUUID();
    var callback = my.handlers[TheNewTricks.UUID.unparse(channelId)];

    // For each event, deliver the event data.
    var numEvents = parser.readUint8();
    for (var i = 0; i < numEvents; i++) {

      var data = parser.readBlob();
      callback(data);
    }
  }

  return Courage;

})(TheNewTricks.Courage || {});
