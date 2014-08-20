//
// format.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // Class private container.
  var Private = Courage._private = Courage._private || {};

  Private.formatSubscribeRequest = function formatSubscribeRequest(username, password, providerId, channelId, deviceId, options) {

    var usernameField = Private.formatString(username);
    var passwordField = Private.formatString(password);
    var providerIdField = Private.formatUUID(providerId);
    var channelIdField = Private.formatUUID(channelId);
    var deviceIdField = Private.formatUUID(deviceId);

    // Initialize the buffer, its views, and a cursor.
    var headerLength = Uint8Array.BYTES_PER_ELEMENT;
    var optionsLength = Uint8Array.BYTES_PER_ELEMENT;
    var length = headerLength +
                 usernameField.length + passwordField.length +
                 providerIdField.length + channelIdField.length + deviceIdField.length +
                 optionsLength;
    var data = new ArrayBuffer(length);
    var dataView = new DataView(data);
    var uint8View = new Uint8Array(data);
    var position = 0;

    // Write the subscribe request header.
    // TODO: use constants.
    dataView.setUint8(position, 0x10); position += headerLength;

    // Write the username and password.
    uint8View.set(usernameField, position); position += usernameField.length;
    uint8View.set(passwordField, position); position += passwordField.length;

    // Write the provider, channel, and device IDs.
    uint8View.set(providerIdField, position); position += providerIdField.length;
    uint8View.set(channelIdField, position); position += channelIdField.length;
    uint8View.set(deviceIdField, position); position += deviceIdField.length;

    // Write options.
    dataView.setUint8(position, options); position += optionsLength;

    return uint8View;
  };

  // TODO: Validate string byte length.
  Private.formatString = function formString(s) {

    // Encode the UFT-8 string.
    var encoder = new TextEncoder('utf-8');
    var stringData = encoder.encode(s);

    // Initialize the buffer, its views, and a cursor.
    var headerLength = Uint8Array.BYTES_PER_ELEMENT;
    var length = headerLength + stringData.byteLength;
    var data = new ArrayBuffer(length);
    var dataView = new DataView(data)
    var uint8View = new Uint8Array(data);
    var position = 0;

    // Write the string length.
    dataView.setUint8(position, stringData.byteLength); position += headerLength;

    // Write the string data.
    uint8View.set(stringData, position); position += stringData.byteLength;

    return uint8View;
  };

  Private.formatUUID = function formUUID(uuid) {
    return uuid;
  };

  return Courage;

})(TheNewTricks.Courage || {});
