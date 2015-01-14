//
// client.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  var DEVICE_ID_KEY = 'com.thenewtricks.courage.deviceId';

  var SUBSCRIBE_PROTOCOL_ID = 1;

  var SUBSCRIBE_REQUEST_MESSAGE_TYPE = 1,
      SUBSCRIBE_SUCCESS_MESSAGE_TYPE = 2,
      SUBSCRIBE_DATA_MESSAGE_TYPE    = 4,
      ACK_EVENTS_MESSAGE_TYPE        = 5;

  var SUBSCRIBE_OPTION_DEFAULT = 0,
      SUBSCRIBE_OPTION_REPLAY  = 1 << 0;

  // The Courage Client is used to subscribe to streaming events from the Courage service.
  //
  // It is initially configured with a websocket URI and provider id..
  //
  // Example URI:
  //     wss://courage-service-staging.tntapp.co/v1/ws/
  //
  // Example provider id:
  //     928308cd-eff8-4ef6-a154-f8268ec663d5
  //
  // After initialization, subscribe options can optionally be set on the client:
  //     client.subscribeOptions = {replay: true};
  //
  // Before subscribing for events, authentication credentials must be set:
  //     client.setAuth(publicKey, privateKey);
  //
  // Finally, the app can use the `bind` method to subscribe to events from a channel:
  //     client.bind('28955ba1-fc5d-4553-9d1b-c751d5110c82', function(data) { console.log(data); });
  Courage.Client = function Client(uri, providerId) {

    this.subscribeOptions = SUBSCRIBE_OPTION_DEFAULT;

    this._uri = uri;
    this._providerId = TheNewTricks.UUID.parse(providerId);
    this._publicKey = '';
    this._privateKey = '';
    this._deviceId = persistentDeviceId();
    this._handlers = {};
    this._connectionManager = null;
  };
  
  Courage.Client.prototype = {

    authenticate: authenticate,
    bind: bind,

    _subscribeToChannels: subscribeToChannels,
    _ackEvents: ackEvents,
    _onConnectionOpen: onConnectionOpen,
    _onConnectionMessage: onConnectionMessage,
    _onSubscribeSuccess: onSubscribeSuccess,
    _onSubscribeData: onSubscribeData,
  };

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

  // authenticate sets the public key and private key the Courage client will use as authentication
  // for `bind` requests to the service.
  function authenticate(publicKey, privateKey) {
    this._publicKey = publicKey;
    this._privateKey = privateKey;
  }

  // The app can use the `bind` method of the Client to subscribe to events from a channel defined
  // by a channelId. All events that match that channelId will be fed to the callback function
  // registered with `bind`.
  //
  // Example:
  //     client.bind('28955ba1-fc5d-4553-9d1b-c751d5110c82', function(data) { console.log(data); });
  //
  // `data` is a Uint8Array.
  function bind(channelId, callback) {

    // If the connection manager isn't started, start it now.
    if (!this._connectionManager) {

      this._connectionManager = new Courage._ConnectionManager(this._uri);
      this._connectionManager.onOpen = this._onConnectionOpen.bind(this);
      this._connectionManager.onMessage = this._onConnectionMessage.bind(this);

      this._connectionManager.start();
    }

    // Register the callback and options for events on the bound channel.
    this._handlers[channelId.toLowerCase()] = callback;

    // If the connection manager is started and connected, subscribe right away. Otherwise no-op;
    // all channels will be subscribed to automatically when the connection is reopened.
    if (this._connectionManager.readyState() === WebSocket.OPEN) {

      var uuid = TheNewTricks.UUID.parse(channelId);
      this._subscribeToChannels([uuid]);
    }
  }

  // subscribeToChannel formats and send a subscribtion request for the specified channelId
  // to teh service.
  function subscribeToChannels(channelIds) {

    // Guard options.
    this.subscribeOptions = this.subscribeOptions || {};

    // Form the SubscribeRequest message.
    var message = new Courage._MessageBuffer();
    message.writeHeader(SUBSCRIBE_PROTOCOL_ID, SUBSCRIBE_REQUEST_MESSAGE_TYPE);

    message.writeUUID(this._providerId);
    message.writeString(this._publicKey);
    message.writeString(this._privateKey);
    message.writeUUID(this._deviceId);
    message.writeUint8(channelIds.length);
    for (var i = 0; i < channelIds.length; i++) {
      message.writeUUID(channelIds[i]);
    }
    message.writeUint8(this.subscribeOptions.replay ? SUBSCRIBE_OPTION_REPLAY : SUBSCRIBE_OPTION_DEFAULT);

    // Send the SubscribeRequest.
    this._connectionManager.send(message.buffer());
  }

  function ackEvents(eventIds) {

    // Form the AckEvents message.
    var message = new Courage._MessageBuffer();
    message.writeHeader(SUBSCRIBE_PROTOCOL_ID, ACK_EVENTS_MESSAGE_TYPE);

    message.writeUint8(eventIds.length);
    for (var i = 0; i < eventIds.length; i++) {
      message.writeUUID(eventIds[i]);
    }

    // Send the message.
    this._connectionManager.send(message.buffer());
  }

  // onConnectionOpen, resubscribe to the channels we are bound to.
  function onConnectionOpen() {

    var channelIds = [];

    for (var channelId in this._handlers) {
      if (this._handlers.hasOwnProperty(channelId)) {

        var uuid = TheNewTricks.UUID.parse(channelId);
        channelIds.push(uuid);
      }
    }

    this._subscribeToChannels(channelIds);
  }

  // onConnectionMessage, deliver streaming events to each of the callbacks bound to a channel id.
  function onConnectionMessage(event) {

    var parser = new Courage._MessageParser(event.data);

    // Discard messages with unrecognized headers.
    var header = parser.readHeader();
    if (header.protocol !== SUBSCRIBE_PROTOCOL_ID) {
      return;
    }

    switch (header.messageType) {

    case SUBSCRIBE_SUCCESS_MESSAGE_TYPE:
      this._onSubscribeSuccess(parser);
      break;

    case SUBSCRIBE_DATA_MESSAGE_TYPE:
      this._onSubscribeData(parser);
      break;

    default:
      return;
    }
  }

  function onSubscribeSuccess(parser) {

    var eventIds = [];

    // Process each channel.
    var numChannels = parser.readUint8();
    for (var i = 0; i < numChannels; i++) {
      var channelId = parser.readUUID();
      var callback = this._handlers[TheNewTricks.UUID.unparse(channelId)];

      // Process each replayed event.
      var numEvents = parser.readUint8();
      for (var j = 0; j < numEvents; j++) {
        var eventId = parser.readUUID();
        var eventPayload = parser.readBlob();

        callback(eventPayload);
        eventIds.push(eventId);
      }
    }

    this._ackEvents(eventIds);
  }

  function onSubscribeData(parser) {
    // Parse the channel id and get the registered callback.
    var channelId = parser.readUUID();
    var callback = this._handlers[TheNewTricks.UUID.unparse(channelId)];

    // Deliver the event data.
    var eventId = parser.readUUID();
    var eventPayload = parser.readBlob();

    callback(eventPayload);
    this._ackEvents([eventId]);
  }

  return Courage;

})(TheNewTricks.Courage || {});
