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

  // formatSubscribeRequest returns a Uint8Array filled with a Subscribe Request payload, with header.
  //
  // Field order is:
  //   - username    (string)
  //   - password    (string)
  //   - providerId  (uuid)
  //   - channelId   (uuid)
  //   - deviceId    (uuid)
  //   - options     (uint8)
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

  // formatString returns a Uint8Array filled with a formatted string payload, without header.
	//
	// A formatted string is a single byte, which specifies the string length,
	// followed by the bytes of the string. Strings must be smaller than 255 bytes,
	// and may be unicode.
  Private.formatString = function formString(s) {

    // TODO: Validate string byte length.

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

  // formatUUID returns a Uint8Array filled with a formatted UUID, without header.
	//
	// UUIDs are 16 bytes in big endian format, and are based on
	// RFC 4122 and DCE 1.1: Authentication and Security Services.
  Private.formatUUID = function formUUID(uuid) {
    return uuid;
  };

  return Courage;

})(TheNewTricks.Courage || {});
