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

/**
 * Constructor method for ZLXServer
 *
 * @return void
 */
let ZLXServer = function(HTTPS_credentials, PORT) {
    var self = this;

    /**
     * Creates the HTTPS server on which to listen to
     */
    let https_server = https.createServer(HTTPS_credentials, (req, res) => {
        res.writeHead(301, { 'Location': 'https://zelexis.com/' });
        res.end();
    });

    // Listens to given port
    https_server.listen(PORT);

    /**
     * Server instance, null on startup
     *
     * @var WebSocket.Server
     */
    this.Server = new WebSocket.Server({
        "server": https_server,
        "verifyClient": Authentication
    });


    console.log("[ZELEXIS CDN Server]");
    console.log("Server open and listening on port " + PORT);

    this.Server.on("connection", function connection(socket, upgradeReq) {
        // Filters the accessToken from the connection requested URL
        socket._accessKey = upgradeReq.headers['sec-websocket-protocol'];

        let User = new UserSocket(socket);

        var user_id = User.id;

        // Handle a connection termination and free the memory
        socket.on("close", function() {
            let User = ConnectionPool.get(user_id);

            if(User) {
                User.handleTermination();
            }

            return true;
        });
    });
}

module.exports = ZLXServer;
