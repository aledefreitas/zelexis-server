/**
 * ZLX P2P CDN
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
var SocketEventHandler = require("./SocketEventHandler.js");
var uuidv4 = require("uuid/v4");

var User = function User(socket, pool) {
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
     * Instance for socket's EventHandler
     *
     * @var Socket\EventHandler
     */
    this.EventHandler = null;

    /**
     * Instance for WebSocket
     *
     * @var WebSocket
     */
    this.Socket = null;

    /**
     * Room on which this socket will be connected to
     *
     * @var string
     */
    this._room = "";

    /**
     * Constructor Method for a User's Socket
     *
     * @param   WebSocket                   socket      Socket connection object
     * @param   Helper\ConnectionPool       pool        Pool of connections to the WebSocket Server
     *
     * @return  string                                  Returns this user's id
     */
    this.constructor = function(socket, pool) {
        // Creates a random id for this socket connection, 16 characters long
        this.id = uuidv4();

        this.Socket = socket;
        this.ConnectionPool = pool;
        this.EventHandler = new SocketEventHandler();
        this._room = socket._accessKey;
        this._uri = socket._uri;

        // Makes this socket join the room for its accessKey
        this.ConnectionPool.join(this._room, this);

        // Binds this object so we can access its methods from within the EventHandler, which is created mostly for better organization and semantics
        this.Socket.on("message", this.EventHandler.onMessage.bind(this));
        this.Socket.on("error", this.EventHandler.onError.bind(this));

        this.send({
            'req': 'identity',
            'id': this.id
        });
        
        this._startHeartbeat();

        return this;
    };

    /**
     * Starts a heartbeat interval to ping this socket connection, checking for outages, so it can terminate if it closed non-gracefully
     *
     * @return void
     */
    this._startHeartbeat = function() {
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
    this.heartbeat = function() {
        if(this._isAlive === false) {
            return this.terminate();
        }

        this._isAlive = false;
        this.Socket.ping("", false, true);

        return true;
    };

    /**
     * Terminates this Socket Connection
     *
     * @return void
     */
    this.terminate = function() {
        return this.Socket.terminate();
    };

    /**
     * Logic to execute when this user's connection is terminated
     *
     * @return void
     */
    this.handleTermination = function() {
        clearInterval(this._heartBeatInterval);
        this.ConnectionPool.leave(this._room, this.id)
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
    this.send = function(data, options, callback) {
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
     * @param   Object      options     Options for the Socket.send()
     * @param   Function    callback    Callback for Socket.send(), receives a parameter containing the array of promise resolutions
     *
     * @throws  Error                   In case the room doesn't exist
     *
     * @return  Promise
     */
    this.broadcast = function(data, options, callback) {
        // If options is not set, and instead it received a callback, set it as the callback
        if(typeof options === "function") {
            callback = options;
            options = null;
        }

        callback = callback || function() { };

        var self = this;
        var broadcastPromises = [];

        try {
            data = JSON.stringify(data);

            // Iterates the room to get users Map
            this.ConnectionPool.in(this._room, this._uri).forEach(function(user_id) {
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
        } catch(e) {
            console.log(e);
        }

        return Promise.all(broadcastPromises).then(function(results) {
            return callback(results);
        }).catch(function(error) {
            console.log(error);
        });
    };

    // Returns the constructor method
    return this.constructor(socket, pool);
};

module.exports = User;
