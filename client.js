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

    // Private members.
    var my = this._private_vars = {};

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

    // Set up the connection manager.
    var url = 'ws://' + my.dsn.host + ':' + my.dsn.port + '/';
    my.connectionManager = new Private.ConnectionManager(url);

    // Initialize a data structure to map channel ids to callbacks.
    my.handlers = {};
  };
  
  Courage.Client.prototype = {

    bind: function bind(channel, callback) {

      // Access to private members.
      var my = this._private_vars;
      var helpers = this._private_methods;

      my.handlers[channel.toLowerCase()] = callback;

      // If we're connected, subscribe right away. If not, we'll subscribe automatically
      // when we open the connection.
      if (my.connectionManager.connected) {
        var uuid = TheNewTricks.UUID.parse(channel);
        helpers.subscribeToChannel.bind(this)(uuid);
      }

      // Start and configure the connection manager for good measure.
      my.connectionManager.start();
      my.connectionManager.onopen = helpers.onConnectionOpen.bind(this);
      my.connectionManager.onmessage = function(e) {

        uint8View = new Uint8Array(e.data);
        console.log(uint8View);
      };
    },

    _private_methods: {

      onConnectionOpen: function onConnectionOpen() {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        // Subscribe to each channel we are bound to.
        for (var channelId in my.handlers) {
          if (my.handlers.hasOwnProperty(channelId)) {

            var uuid = TheNewTricks.UUID.parse(channelId);
            helpers.subscribeToChannel.bind(this)(uuid);
          }
        }
      },

      subscribeToChannel: function subscribeToChannel(channelId) {

        // Access to private members.
        var my = this._private_vars;
        var helpers = this._private_methods;

        // Form the subscribe request.
        var username = my.dsn.username,
            password = my.dsn.password,
            providerId = my.dsn.providerId,
            channelId = channelId,
            deviceId = my.deviceId,
            options = 0;

        var request = Private.formatSubscribeRequest(username, password, providerId, channelId, deviceId, options);

        my.connectionManager.send(request.buffer);
      },
    },
  };

  return Courage;

})(TheNewTricks.Courage || {});
