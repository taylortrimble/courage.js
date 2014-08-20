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
  var Private = Courage._private = Courage._private || {};

  var DSN_KEYS      = 'username password host port providerId'.split(' '),
      DSN_PATTERN   = /^([0-9a-z-]+):([0-9a-z-]+)@([0-9a-z-\.]+):([0-9]+)\/([0-9a-z-]+)$/i,
      DEVICE_ID_KEY = 'com.thenewtricks.courage.deviceId';

  Courage.Client = function Client(dsn) {

    // Container for private variables.
    var my = this._private = {};

    // Parse DSN.
    my.dsn = {};
    var m = DSN_PATTERN.exec(dsn);

    for (var i = 0; i < DSN_KEYS.length; i++) {
      my.dsn[DSN_KEYS[i]] = m[i + 1] || '';
    }

    my.dsn.providerId = TheNewTricks.UUID.parse(my.dsn.providerId);

    // Retrieve Device Id from local storage if possible, or generate a new one.
    my.deviceId = TheNewTricks.UUID.parse(localStorage[DEVICE_ID_KEY]);
    if (!my.deviceId) {
      my.deviceId = TheNewTricks.UUID.generateV4();
      localStorage[DEVICE_ID_KEY] = TheNewTricks.UUID.unparse(my.deviceId);
    }

    // Set default values.
    my.connection = null;
  };
  
  Courage.Client.prototype = {

    bind: function bind(channel, callback) {

      // Access to private variables.
      var my = this._private;

      // Make the WebSocket connection if it doesn't already exist.
      var url = 'ws://' + my.dsn.host + ':' + my.dsn.port + '/';
      my.connection = new WebSocket(url);

      // Configure the WebSocket connection.
      my.connection.binaryType = 'arraybuffer';

      my.connection.onerror = function(error) {
        console.log('WebSocket error: ' + error);
      };

      my.connection.onclose = function() {
        console.log('WebSocket closed');
      };

      // Form and send the subscribe request.
      my.connection.onopen = function() {
        console.log('WebSocket opened');

        // Form the subscribe request.
        var username = my.dsn.username,
            password = my.dsn.password,
            providerId = my.dsn.providerId,
            channelId = TheNewTricks.UUID.parse(channel),
            deviceId = my.deviceId,
            options = 0;

        var request = Private.formatSubscribeRequest(username, password, providerId, channelId, deviceId, options);

        my.connection.send(request.buffer);
      };

      // Handle received messages.
      my.connection.onmessage = function(e) {
        console.log(e.data);
      };
    },
  };

  return Courage;

})(TheNewTricks.Courage || {});
