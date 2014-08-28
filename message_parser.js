//
// message_parser.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.Courage = (function(Courage) {

  // Class private container.
  var PrivateCourage = Courage._private = Courage._private || {};

  PrivateCourage.MessageParser = function MessageBuffer(buffer) {

    // Private members.
    this._private = {
      buffer: buffer,
      cursor: 0,
    };
  };

  // A MessageParser provides a method of parsing a message payload.
  //
  // The MessageParser is initialized with ArrayBuffer data, and the
  // following types can be parsed:
  //   - the message header
  //   - uint8
  //   - UUID
  //   - Blob
  PrivateCourage.MessageParser.prototype = {

    // readHeader parses the protocolId and messageType from
    // the buffer.
    readHeader: function readHeader() {

      var header = nextUint8View.bind(this)(1);
      
      return {
        protocol: header[0] >> 4,
        messageType: header[0] & 0x0F,
      };
    },

    // readUint8 reads an 8-bit unsigned integer from the buffer.
    readUint8: function readUint8() {

      return nextDataView.bind(this)(1).getUint8(0);
    },

    // readUUID reads a 16 byte UUID from the buffer.
    //
    // UUIDs are 16 bytes in big endian format, and are based on
    // RFC 4122 and DCE 1.1: Authentication and Security Services.
    readUUID: function readUUID() {

      return nextUint8View.bind(this)(16);
    },

    // readBlob parses a formatted data blob from the buffer.
    //
    // A formatted data blob is two bytes in big endian format, which specifies the
    // blob length, followed by the bytes of data. Blob data must be 65,535 bytes
    // or fewer.
    readBlob: function readBlob() {

      var size = nextDataView.bind(this)(2).getUint16(0);
      return nextUint8View.bind(this)(size);
    },
  };

  // nextUint8View creates a new Uint8Array of size `size` at the cursor, and then
  // moves the cursor.
  function nextUint8View(size) {

    // Access to private members.
    var my = this._private;

    var nextView = new Uint8Array(my.buffer, my.cursor, size);
    my.cursor += size;

    return nextView;
  }

  // nextDataView creates a new DataView of size `size` at the cursor, and then
  // moves the cursor.
  function nextDataView(size) {

    // Access to private members.
    var my = this._private;

    var nextView = new DataView(my.buffer, my.cursor, size);
    my.cursor += size;

    return nextView;
  }

  return Courage;

})(TheNewTricks.Courage || {});
