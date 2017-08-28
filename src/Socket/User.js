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

var SocketEventHandler = require("./EventHandler.js");

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
     * Constructor Method for a User's Socket
     *
     * @param   WebSocket                   socket      Socket connection object
     * @param   Helper\ConnectionPool       pool        Pool of connections to the WebSocket Server
     *
     * @return  Socket\User
     */
    this.constructor = function(socket, pool) {
        this.Socket = socket;
        this.ConnectionPool = pool;
        this.EventHandler = new SocketEventHandler();

        let _accessKey = socket._accessKey;

        this.ConnectionPool.add(_accessKey, this);

        this.Socket.on("message", this.EventHandler.onMessage.bind(this));
        this.Socket.on("error", this.EventHandler.onError.bind(this));
        this.Socket.on("close", this.EventHandler.onClose.bind(this));

        this._startHeartbeat();
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
            clearInterval(this._heartBeatInterval);
            return this.Socket.terminate();
        }

        this._isAlive = false;
        this.Socket.ping("", false, true);

        return true;
    };

    // Returns the constructor method
    return this.constructor(socket, pool);
};

module.exports = User;
