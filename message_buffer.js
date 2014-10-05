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
  // The following types can be written to the buffer:
  //   - Message header
  //   - Uint8
  //   - UUID
  //   - String
  //
  // The buffer may then be retrieved with `buffer`, an ArrayBuffer.
  Courage._MessageBuffer = function MessageBuffer() {

    // Private members.
    this._buffer = new ArrayBuffer();
    this._cursor = 0;
  };

  Courage._MessageBuffer.prototype = {

    writeHeader: writeHeader,
    writeUint8: writeUint8,
    writeUUID: writeUUID,
    writeBlob: writeBlob,
    writeString: writeString,

    buffer: buffer,

    _grow: grow,
  };

  // Write the protocol id and message type header to the buffer.
  function writeHeader(protocolId, messageType) {

    var header = (protocolId << 4) + messageType
    this.writeUint8(header);
  }

  // writeUint8 appends an 8-bit integer to the buffer.
  function writeUint8(u) {

    this._grow(1);

    var dataView = new DataView(this._buffer);
    dataView.setUint8(this._cursor, u);
    this._cursor += 1;
  }

  // writeUUID appends a 16 byte UUID to the buffer.
  //
  // writeUUID takes a Uint8Array.
  //
  // UUIDs are 16 bytes in big endian format, and are based on
  // RFC 4122 and DCE 1.1: Authentication and Security Services.
  function writeUUID(uuid) {

    this._grow(16);

    var uint8View = new Uint8Array(this._buffer);
    uint8View.set(uuid, this._cursor);
    this._cursor += 16;
  }

  // writeBlob appends a formatted data blob to the buffer.
  //
  // writeBlob takes an ArrayBuffer.
  //
  // A formatted data blob is two bytes in big endian format, which specifies the
  // blob length, followed by the bytes of data. Blob data must be 65,535 bytes
  // or fewer.
  function writeBlob(data) {

    this._grow(2 + data.byteLength);

    // Create the ArrayBuffer views.
    var bufferDataView = new DataView(this._buffer);
    var bufferUint8View = new Uint8Array(this._buffer);
    var dataUint8View = new Uint8Array(data);

    // Write the string length header, followed by the string data.
    bufferDataView.setUint16(this._cursor, data.byteLength);
    this._cursor += 2;
    bufferUint8View.set(dataUint8View, this._cursor);
    this._cursor += data.byteLength;
  }

  // writeString appends a formatted string to the buffer.
  //
  // A formatted string uses the same underlying format as a formatted data blob,
  // but always contains UTF-8 data.
  function writeString(s) {

    // Encode the UTF-8 string.
    var encoder = new TextEncoder('utf-8');
    var stringData = encoder.encode(s).buffer;

    this.writeBlob(stringData);
  }

  // buffer returns the raw, underlying ArrayBuffer.
  function buffer() {
    return this._buffer;
  }

  // grow grows the underlying Uint8Array by `size` bytes.
  //
  // Do not grow the buffer more than the amount needed, as this will result
  // in a padded buffer.
  function grow(size) {

    // Copy the contents of the existing buffer into a new, bigger buffer.
    var existingBuffer = new Uint8Array(this._buffer);
    var newBuffer = new Uint8Array(this._buffer.byteLength + size);
    newBuffer.set(existingBuffer);

    // Set the internal buffer to the new buffer.
    this._buffer = newBuffer.buffer;
  }

  return Courage;

})(TheNewTricks.Courage || {});
