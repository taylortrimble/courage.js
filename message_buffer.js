//
// message_buffer.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // A MessageBuffer provides a method for creating a message payload.
  //
  // The MessageBuffer is initialized with the protocol and messageType it represents.
  // Then the following types can be appended to the buffer:
  //   - uint8
  //   - UUID
  //   - string
  //
  // The buffer may then be retrieved with `buffer`, a Uint8Array.
  Courage._MessageBuffer = function MessageBuffer(protocolId, messageType) {

    // Create a new buffer with the message header.
    var uint8View = new Uint8Array(1);
    uint8View[0] = protocolId << 4 + messageType;

    // Private members.
    this._buffer = uint8View;
    this._cursor = 1;
  };

  Courage._MessageBuffer.prototype = {

    writeUint8: writeUint8,
    writeUUID: writeUUID,
    writeString: writeString,

    buffer: buffer,

    _grow: grow,
    _write: write,
    _writeByte: writeByte,
  };

  // writeUint8 appends an 8-bit integer to the buffer.
  function writeUint8(u) {

    this._grow(1);
    this._writeByte(u);
  }

  // writeUUID appends a 16 byte UUID to the buffer.
  //
  // UUIDs are 16 bytes in big endian format, and are based on
  // RFC 4122 and DCE 1.1: Authentication and Security Services.
  function writeUUID(uuid) {

    this._grow(uuid.length);
    this._write(uuid);
  }

  // writeString appends a formatted string to the buffer.
  //
  // A formatted string is a single byte, which specifies the string length,
  // followed by the bytes of the string. Strings must be smaller than 255 bytes,
  // and may be UTF-8.
  function writeString(s) {

    // Access to private members.
    var my = this._private;

    // Encode the UTF-8 string.
    var encoder = new TextEncoder('utf-8');
    var stringData = encoder.encode(s);

    // Grow the buffer by enough to hold the header and UTF-8 string data.
    this._grow(1 + stringData.length);

    // Write the string length header, followed by the string data.
    this._writeByte(stringData.length);
    this._write(stringData);
  }

    // buffer returns the raw, underlying ArrayBuffer.
    function buffer() {
      return this._buffer;
    }

  // grow grows the underlying Uint8Array by `size` bytes.
  //
  // A call to grow must be followed by a sequence of write and writeByte calls
  // that fill the entire size grown. Do not grow the buffer more than the amount
  // needed, as this will result in a padded buffer.
  function grow(size) {

    var newBuffer = new Uint8Array(this._buffer.length + size);
    newBuffer.set(this._buffer);

    this._buffer = newBuffer;
  }

  // write appends a Uint8Array after the cursor, then moves the cursor.
  // There must be space in the buffer, given by grow.
  function write(data) {

    this._buffer.set(data, this._cursor);
    this._cursor += data.length;
  }

  // writeByte appends a byte after the cursor, then moves the cursor.
  // There must be space in the buffer, given by grow.
  function writeByte(byte) {

    this._buffer[this._cursor] = byte;
    this._cursor += 1;
  }

  return Courage;

})(TheNewTricks.Courage || {});
