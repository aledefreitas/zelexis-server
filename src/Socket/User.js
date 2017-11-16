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

/**
 * Constructor Method for a User's Socket
 *
 * @param   WebSocket                   socket      Socket connection object
 * @param   Tracker\ConnectionPool      pool        Pool of connections to the WebSocket Server
 *
 * @return  string                                  Returns this user's id
 */
var User = function User(socket, pool) {
    var self = this;

    /**
     * Heartbeat interval delay, in milliseconds
     * Pings the socket in this interval to check for open connections
     *
     * @var int
     */
    this._heartBeatTimer = 30000;

    /**
     * Boolean indicating if a connection is still alive or not
     *
     * @var boolean
     */
    this._isAlive = true;

    /**
     * Interval for heartbeats
     *
     * @var Interval
     */
    this._heartBeatInterval = null;

    /**
     * Instance for the server ConnectionPool
     *
     * @var Helper\ConnectionPool
     */
    this.ConnectionPool = null;

    /**
     * Instance for socket's PeerHandshaking
     *
     * @var Socket\PeerHandshaking
     */
    this.PeerHandshaking = null;

    /**
     * Instance for WebSocket
     *
     * @var WebSocket
     */
    this.Socket = null;

    /**
     * Domain on which this socket will be connected to
     *
     * @var string
     */
    this._domain = "";

    /**
     * Swarms on which this socket is added to
     *
     * @var Set
     */
    this._swarms = new Set();

    // Creates a random id for this socket connection, 16 characters long
    this.id = uuidv4();

    this.Socket = socket;
    this.ConnectionPool = pool;
    this._domain = socket._accessKey;

    // Adds the user to active connections within the server
    this.ConnectionPool.add(this);

    this.PeerHandshaking = new PeerHandshaking(this.id, this.ConnectionPool);

    // Binds this object so we can access its methods from within the PeerHandshaking, which is created mostly for better organization and semantics
    // TODO: Transformar em um dispatcher de eventos
    this.Socket.on("message", function(message) {
        return self.PeerHandshaking.onMessage(message);
    });
    this.Socket.on("error", function(error) {
        return self.PeerHandshaking.onError(error);
    });

    // Sends the identity to the peer
    this.send({
        'req': 'identity',
        'id': this.id
    });

    this._startHeartbeat();
};

/**
 * Starts a heartbeat interval to ping this socket connection, checking for outages, so it can terminate if it closed non-gracefully
 *
 * @return void
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
 * @return boolean
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
 * @return void
 */
User.prototype.terminate = function() {
    return this.Socket.terminate();
};

/**
 * Logic to execute when this user's connection is terminated
 *
 * @return void
 */
User.prototype.handleTermination = function() {
    this.broadcast({
        "from": this.id,
        "req": "pair_disconnected"
    });

    clearInterval(this._heartBeatInterval);

    // Iterates all swarms on which the user is active right now, and leaves them
    this._swarms.forEach(function(swarm) {
        this.ConnectionPool.leave(swarm, this.id);
    }.bind(this));

    this.ConnectionPool.delete(this.id);
};

/**
 * Override for Socket.send()
 *
 * @param   any         data        The data to send
 * @param   Object      options     Options for the Socket.send()
 * @param   Function    callback    Callback for Socket.send()
 *
 * @return Socket.send
 */
User.prototype.send = function(data, options, callback) {
    try {
        data = JSON.stringify(data);

        // If options is not set, and instead it received a callback, set it as the callback
        if(typeof options === "function") {
            callback = options;
            options = null;
        }

        return this.Socket.send(Buffer.from(data), options, callback);
    } catch (e) {
        console.log(e);
        return;
    }
};

/**
 * Broadcasts a message to all sockets within the same room
 *
 * @param   any         data        The data to send
 * @param   mixed       swarm       The Swarm(s) to broadcast to, broadcasts to all if null
 * @param   Object      options     Options for the Socket.send()
 * @param   Function    callback    Callback for Socket.send(), receives a parameter containing the array of promise resolutions
 *
 * @throws  Error                   In case the room doesn't exist
 *
 * @return  Promise
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
            data = JSON.stringify(data);

            // Iterates the swarm
            this.ConnectionPool.in(this._domain, swarm).forEach(function(user_id) {
                // If the user iterating has the same id as this, we skip it
                if(user_id == self.id) {
                    return;
                }

                // Then we add its Socket.send() to our promises array, so we can return all results after all sends are done
                broadcastPromises.push(
                    new Promise(function(resolve) {
                        let _user = self.ConnectionPool.get(user_id);

                        // If the user's socket doesn't exist anymore, we resolve the promise to false
                        if(!_user.Socket) {
                            resolve(false);
                        }

                        _user.Socket.send(Buffer.from(data), options, function(error) {
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
