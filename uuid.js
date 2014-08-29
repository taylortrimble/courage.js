//
// uuid.js
// courage.js
//
// Copyright (c) 2014 The New Tricks, LLC.
// MIT License.
//

var TheNewTricks = TheNewTricks || {};

TheNewTricks.UUID = (function(UUID) {

  var HYPEN_INDEXES = [4, 6, 8, 10];  // Values signify the logical UUID byte
                                      // after which a hyphen is appended.

  // Parse parses a UUID of the format:
  //    9e561659-a4ce-43ea-803c-a0181224ce34
  //
  // into a Uint8Array. It is case-insensitive.
  var parse = function parse(s) {

    // Validate s.
    var uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    if (!uuidRegex.test(s)) {
      return null;
    }

    // Since we passed the regex, we can remove the hyphens and
    // assume that 16 2-character octets exist.
    var normalized = s.replace(/-/g, '');

    var uuid = new Uint8Array(16);
    for (var i = 0; i < 16; i++) {
      var hexOctet = normalized.substr(i * 2, 2);
      uuid[i] = parseInt(hexOctet, 16);
    }

    return uuid;
  };

  // generateV4 attempts to generate a cryptographically-secure version 4 UUID.
  //
  // If it is available, this function will use crypto.getRandomValues.
  // If not, Math.random is used.
  //
  // A Uint8Array is returned.
  var generateV4 = function generateV4() {

    var uuid = new Uint8Array(16);

    // Use crypto.getRandomBytes if we can. Otherwise, we'll hope Math.random is good enough.
    if (crypto && crypto.getRandomValues) {
      crypto.getRandomValues(uuid);
    } else {
      for (var i = 0; i < 16; i++) {
        uuid[i] = Math.floor(Math.random() * 255);
      }
    }

    uuid[6] = (uuid[6] & 0x0f) | 0x40; // Version 4
    uuid[8] = (uuid[8] & 0x3f) | 0x80; // Variant is 10

    return uuid;
  };

  // Unparse turns a UUID represented by a 16-byte Uint8Array into a string formatted as:
  //    9e561659-a4ce-43ea-803c-a0181224ce34
  var unparse = function unparse(uuid){

    var unparsed = '';

    for (var i = 0; i < uuid.length; i++) {

      // Convert the byte to a full 2-character base 16 representation.
      var s = uuid[i].toString(16);
      if (s.length < 2) {
        s = '0' + s;
      }

      // If necessary, append a hyphen.
      if (HYPEN_INDEXES.indexOf(i) !== -1) {
        unparsed += "-";
      }

      unparsed += s;
    }

    return unparsed;
  };

  return {
    parse: parse,
    generateV4: generateV4,
    unparse: unparse,
  };

})(TheNewTricks.UUID || {});
