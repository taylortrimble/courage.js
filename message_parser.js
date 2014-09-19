//
// message_parser.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // A MessageParser provides a method of parsing a message payload.
  //
  // The MessageParser is initialized with ArrayBuffer data, and the
  // following types can be parsed:
  //   - the message header
  //   - uint8
  //   - UUID
  //   - Blob
  Courage._MessageParser = function MessageParser(buffer) {

    // Private members.
    this._buffer = buffer;
    this._cursor = 0;
  };

  Courage._MessageParser.prototype = {

    readHeader: readHeader,
    readUint8: readUint8,
    readUUID: readUUID,
    readBlob: readBlob,

    _nextUint8View: nextUint8View,
    _nextDataView: nextDataView,
  };

  // readHeader parses the protocolId and messageType from
  // the buffer.
  function readHeader() {

    var header = this._nextUint8View(1);
    
    return {
      protocol: header[0] >> 4,
      messageType: header[0] & 0x0F,
    };
  }

  // readUint8 reads an 8-bit unsigned integer from the buffer.
  function readUint8() {
    return this._nextDataView(1).getUint8(0);
  }

  // readUUID reads a 16 byte UUID from the buffer.
  //
  // UUIDs are 16 bytes in big endian format, and are based on
  // RFC 4122 and DCE 1.1: Authentication and Security Services.
  function readUUID() {
    return this._nextUint8View(16);
  }

  // readBlob parses a formatted data blob from the buffer.
  //
  // A formatted data blob is two bytes in big endian format, which specifies the
  // blob length, followed by the bytes of data. Blob data must be 65,535 bytes
  // or fewer.
  function readBlob() {

    var size = this._nextDataView(2).getUint16(0);
    return this._nextUint8View(size);
  }

  // nextUint8View creates a new Uint8Array of size `size` at the cursor, and then
  // moves the cursor.
  function nextUint8View(size) {

    var nextView = new Uint8Array(this._buffer, this._cursor, size);
    this._cursor += size;

    return nextView;
  }

  // nextDataView creates a new DataView of size `size` at the cursor, and then
  // moves the cursor.
  function nextDataView(size) {

    var nextView = new DataView(this._buffer, this._cursor, size);
    this._cursor += size;

    return nextView;
  }

  return Courage;

})(TheNewTricks.Courage || {});
