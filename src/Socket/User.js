/**
 * ZELEXIS CDN
 *
 * Node.JS Server
 *
 * Peer To Peer CDN relaying on WebRTC technology to deliver files from user to user, with fallback to online servers
 *
 * @license     PRIVATE
 * @author      Alexandre de Freitas <https://github.com/aledefreitas>
 * @copyright   ZLX Projetos Web LTDA - ME & Alexandre de Freitas Caetano
 * @since       0.0.1
 */

// Load dependencies
var PeerHandshaking = require("./PeerHandshaking.js");
var uuidv4 = require("uuid/v4");
var WSMProtocol = require("../Protocol/WebSocketMessageProtocol.js");
var ConnectionPool = require("../Tracker/ConnectionPool.js");

/**
 * Constructor Method for a User's Socket
 *
 * @param   {WebSocket.Socket}      socket      Socket connection object
 *
 * @return  {void}
 */
function User(socket) {
    var self = this;

    /**
     * Random Identity for this socket connection, using uuidv4
     *
     * @var {string}
     */
    this.id = uuidv4();

    /**
     * Heartbeat interval delay, in milliseconds
     * Pings the socket in this interval to check for open connections
     *
     * @var {int}
     */
    this._heartBeatTimer = 30000;

    /**
     * Boolean indicating if a connection is still alive or not
     *
     * @var {boolean}
     */
    this._isAlive = true;

    /**
     * Interval for heartbeats
     *
     * @var {Interval}
     */
    this._heartBeatInterval = null;

    /**
     * Instance for WebSocket
     *
     * @var {WebSocket.Socket}
     */
    this.Socket = socket;

    /**
     * Domain on which this socket will be connected to
     *
     * @var {string}
     */
    this._domain = socket._accessKey;

    /**
     * Swarms on which this socket is added to
     *
     * @var {Set}
     */
    this._swarms = new Set();

    /**
     * Instance of WebSocketMessageProtocol
     *
     * @var {WebSocketMessageProtocol}
     */
    this.WSMProtocol = new WSMProtocol();

    /**
     * Adds this user to the connection pool
     */
    ConnectionPool.add(this);

    /**
     * Instance for socket's PeerHandshaking
     *
     * @var {Socket\PeerHandshaking}
     */
    this.PeerHandshaking = new PeerHandshaking(this.id);

    // Whenever we receive a message, we dispatch the event to the WebSocketMessage Protocol class to handle it
    this.Socket.on("message", function(message) {
        self.WSMProtocol.emit("message", message);
    });

    this.Socket.on("error", function(error) {
        self.terminate();
    });

    // Then we start the hearbeat to keep the connection alive
    this._startHeartbeat();
};

/**
 * Starts a heartbeat interval to ping this socket connection, checking for outages, so it can terminate if it closed non-gracefully
 *
 * @return {void}
 */
User.prototype._startHeartbeat = function() {
    this.Socket.on("pong", function() {
        this._isAlive = true;
    }.bind(this));

    this._heartBeatInterval = setInterval(this.heartbeat.bind(this), this._heartBeatTimer);
};

/**
 * Executes a hearbeat to the socket connection
 *
 * @return {boolean}
 */
User.prototype.heartbeat = function() {
    if(this._isAlive === false) {
        return this.terminate();
    }

    this._isAlive = false;
    this.Socket.ping(1, false, true);

    return true;
};

/**
 * Terminates this Socket Connection
 *
 * @return {void}
 */
User.prototype.terminate = function() {
    return this.Socket.terminate();
};

/**
 * Logic to execute when this user's connection is terminated
 *
 * @return {void}
 */
User.prototype.handleTermination = function() {
    clearInterval(this._heartBeatInterval);

    // Iterates all swarms on which the user is active right now, and leaves them
    this._swarms.forEach(function(swarm) {
        this.broadcast(this.WSMProtocol.write(
            this.WSMProtocol.OUTGOING.PEER_DISCONNECTED,
            {
                'from': this.id,
                'swarm_id': swarm
            }
        ), swarm);

        ConnectionPool.leave(swarm, this.id);
    }.bind(this));

    ConnectionPool.delete(this.id);
};

/**
 * Override for Socket.send()
 *
 * @param   {object}        data        The data to send
 * @param   {object}        options     Options for the Socket.send()
 * @param   {function}      callback    Callback for Socket.send()
 *
 * @return  {void}
 */
User.prototype.send = function(data, options, callback) {
    try {
        // If options is not set, and instead it received a callback, set it as the callback
        if(typeof options === "function") {
            callback = options;
            options = null;
        }

        if(this.Socket)
            this.Socket.send(data, options, callback);
    } catch (e) {
        console.log(e);
        return;
    }
};

/**
 * Broadcasts a message to all sockets within the same room
 *
 * @param   {object}        data        The data to send
 * @param   {mixed}         swarm       The Swarm(s) to broadcast to, broadcasts to all if null
 * @param   {object}        options     Options for the Socket.send()
 * @param   {function}      callback    Callback for Socket.send(), receives a parameter containing the array of promise resolutions
 *
 * @return  {Promise}
 */
User.prototype.broadcast = function(data, swarm, options, callback) {
    // If options is not set, and instead it received a callback, set it as the callback
    if(typeof options === "function") {
        callback = options;
        options = null;
    }

    callback = callback || function() { };

    var self = this;
    var broadcastPromises = [];

    try {
        if(swarm == null) {
            // Iterates all the swarms on which the user is on, and broadcasts there
            this._swarms.forEach(function(swarm, key, set) {
                broadcastPromises.push(this.broadcast(data, swarm, options, callback));
            }.bind(this));
        } else {
            // Iterates the swarm
            ConnectionPool.in(this._domain, swarm).forEach(function(user_id) {
                // If the user iterating has the same id as this, we skip it
                if(user_id == self.id) {
                    return;
                }

                // Then we add its Socket.send() to our promises array, so we can return all results after all sends are done
                broadcastPromises.push(
                    new Promise(function(resolve) {
                        let _user = ConnectionPool.get(user_id);

                        // If the user's socket doesn't exist anymore, we resolve the promise to false
                        if(!_user.Socket) {
                            resolve(false);
                        }

                        _user.Socket.send(data, options, function(error) {
                            // If there are no errors, we resolve the promise to true
                            if(!error) {
                                resolve(true);
                            }

                            // Otherwise, we resolve it to its error
                            resolve(error);
                        });
                    })
                );
            });
        }
    } catch(e) {
        console.log(e);
    }

    return Promise.all(broadcastPromises).then(function(results) {
        return callback(results);
    }).catch(function(error) {
        console.log(error);
    });
};

module.exports = User;
