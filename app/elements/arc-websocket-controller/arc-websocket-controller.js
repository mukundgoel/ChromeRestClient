(function() {
'use strict';
/* global WebSocketMessage */
Polymer({
  is: 'arc-websocket-controller',
  behaviors: [
    ArcBehaviors.ArcControllerBehavior,
    ArcBehaviors.ArcFileExportBehavior
  ],
  properties: {
    /**
     * True if &lt;web-socket&gt; is trying to connect to the remote server.
     */
    connecting: {
      type: Boolean,
      readOnly: true,
      value: false
    },
    /**
     * True if the socket is connected.
     */
    connected: {
      type: Boolean,
      readOnly: true,
      value: false
    },
    /**
     * Tru if the socket is disconnected (`connect` is false) but the component is trying to
     * reconnect.
     */
    retrying: Boolean,
    /**
     * A list of messages sent to and received from the server.
     *
     * @type {Array}
     */
    messages: {
      type: Array,
      value: [],
      notify: true
    },
    /**
     * Last used URL.
     */
    lastSocketUrl: {
      type: String,
      value: 'ws://echo.websocket.org'
    }
  },

  onShow: function() {
    this._setPageTitle('Socket');
  },
  onHide: function() {
    this._setPageTitle('');
  },
  /**
   * Message received handler.
   */
  _messageReceived: function(e) {
    var message = new WebSocketMessage({
      message: e.detail.data,
      direction: 'in'
    });
    this.push('messages', message);
    //console.log(message);
  },

  _onDisconnected: function() {
    // console.log('disconnected');
    this._setConnecting(false);
    this._setConnected(false);
  },

  _onConnected: function() {
    // console.log('_onConnected');
    this._setConnecting(false);
    this._setConnected(true);
  },

  _onError: function(e) {
    console.error(e.detail.error);
    this._setConnecting(false);
  },

  _connect: function(e) {
    var url = e.detail.url;
    this.$.socket.url = url;
    this._setConnecting(true);
    this.$.socket.open();
    this.lastSocketUrl = this.$.socket.url;
    arc.app.analytics.sendEvent('Engagement', 'Click', 'Connect to socket');
  },

  _disconnect: function() {
    this.$.socket.close();
  },

  _send: function(e) {
    var message = new WebSocketMessage({
      message: e.detail.message,
      direction: 'out'
    });
    this.push('messages', message);
    this.$.socket.message = message.isBinary ? message.binaryData : message.message;
    this.$.socket.send();
    arc.app.analytics.sendEvent('Engagement', 'Click', 'Send message to socket');
  },

  _downloadBinary: function(e) {
    var msg = e.detail.message;
    if (!msg || !msg.isBinary) {
      return;
    }
    this.fileSuggestedName = 'socket-message';
    this.exportContent = msg.binaryData;
    this.exportMime = 'application/octet-stream';
    this.exportData();
  },
  /**
   * Clear messages log output
   */
  clearMessages: function() {
    this.set('messages', []);
  },
  /**
   * Exporrt all messages to a file.
   */
  exportMessages: function() {
    this.fileSuggestedName = 'socket-messages';
    this.exportContent = this.messages;
    this.exportMime = 'json';
    this.exportData();
  },

  _restoredHandler: function() {
    if (this.lastSocketUrl) {
      this.$.view.url = this.lastSocketUrl;
    }
  }
});
})();
