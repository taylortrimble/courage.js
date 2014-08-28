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
  var PrivateCourage = Courage._private = Courage._private || {};

  PrivateCourage.MessageBuffer = function MessageBuffer(protocolId, messageType) {

    // Create a new buffer with the message header.
    var uint8View = new Uint8Array(1);
    uint8View[0] = protocolId << 4 + messageType;

    // Private members.
    this._private = {
      buffer: uint8View,
      position: 1,
    };
  };

  PrivateCourage.MessageBuffer.prototype = {

    // writeString writes a formatted string to the buffer.
  	//
  	// A formatted string is a single byte, which specifies the string length,
  	// followed by the bytes of the string. Strings must be smaller than 255 bytes,
  	// and may be UTF-8.
    writeString: function writeString(s) {

      // Access to private members.
      var my = this._private;

      // Encode the UTF-8 string.
      var encoder = new TextEncoder('utf-8');
      var stringData = new Uint8Array(encoder.encode(s));

      // Grow the buffer by enough to hold the header and UTF-8 string data.
      grow.bind(this)(Uint8Array.BYTES_PER_ELEMENT + stringData.length);

      // Write the string length header, followed by the string data.
      writeByte.bind(this)(stringData.length);
      write.bind(this)(stringData);
    },

    // writeUUID writes a 16 byte UUID to the buffer.
  	//
  	// UUIDs are 16 bytes in big endian format, and are based on
  	// RFC 4122 and DCE 1.1: Authentication and Security Services.
    writeUUID: function writeUUID(uuid) {

      grow.bind(this)(uuid.length);
      write.bind(this)(uuid);
    },

    // writeUint8 writes an 8-bit integer to the buffer.
    writeUint8: function writeUint8(u) {

      grow.bind(this)(Uint8Array.BYTES_PER_ELEMENT);
      writeByte.bind(this)(u);
    },

    // buffer returns the raw, underlying ArrayBuffer.
    buffer: function buffer() {

      // Access to private members.
      var my = this._private;

      return my.buffer.buffer;
    }
  };

  // grow grows the underlying Uint8Array by `size` bytes.
  //
  // A call to grow must be followed by a sequence of write and writeByte calls
  // that fill the entire size grown. Do not grow the buffer more than the amount
  // needed, as this will result in a padded buffer.
  function grow(size) {

    // Access to private members.
    var my = this._private;

    var newBuffer = new Uint8Array(my.buffer.length + size);
    newBuffer.set(my.buffer);

    my.buffer = newBuffer;
  }

  // write appends a Uint8Array after the cursor.
  // There must be space in the buffer, given by grow.
  function write(data) {

    // Access to private members.
    var my = this._private;

    my.buffer.set(data, my.position);
    my.position += data.length;
  }

  // writeByte appends a byte after the cursor.
  // There must be space in the buffer, given by grow.
  function writeByte(byte) {

    // Access to private members.
    var my = this._private;

    my.buffer[my.position] = byte;
    my.position += Uint8Array.BYTES_PER_ELEMENT;
  }

  return Courage;

})(TheNewTricks.Courage || {});
