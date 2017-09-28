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
var WebSocket = require("ws");
var https = require("https");
var Authentication = require("../Helper/Authentication.js");
var UserSocket = require("../Socket/User.js");
var ConnectionPool = require("../Tracker/ConnectionPool.js");

let ZLXServer = function(HTTPS_credentials, PORT) {
    /**
     * Server instance, null on startup
     *
     * @var WebSocket.Server
     */
    this.Server = null;

    /**
     * Instance of ConnectionPool
     * Array Pool of connections to this server
     *
     * @var Helper\ConnectionPool
     */
    this.ConnectionPool = null;

    /**
     * Constructor method for ZLXServer
     *
     * @return self
     */
    this.construct = function construct(HTTPS_credentials, _port) {
        var self = this;

        let https_server = https.createServer(HTTPS_credentials, (req, res) => {
            res.writeHead(301, { 'Location': 'https://zelexis.com/' });
            res.end();
        });

        let WS_Server = WebSocket.Server;

        this.Server = new WS_Server({
            "server": https_server,
            "verifyClient": Authentication
        });

        this.ConnectionPool = new ConnectionPool();

        https_server.listen(_port);

        console.log("[ZELEXIS CDN Server]");
        console.log("Server open and listening on port " + _port);

        this.Server.on("connection", function connection(socket, upgradeReq) {
            // Filters the accessToken from the connection requested URL
            socket._accessKey = upgradeReq.headers['sec-websocket-protocol'];

            var user_id = self.ConnectionPool.add(new UserSocket(socket, self.ConnectionPool));

            // Handle a connection termination and free the memory
            socket.on("close", function() {
                let User = self.ConnectionPool.get(user_id);

                if(User) {
                    User.handleTermination();
                }

                return true;
            });
        });

        return this;
    };

    // Returns the constructor method
    return this.construct(HTTPS_credentials, PORT);
}

module.exports = ZLXServer;
