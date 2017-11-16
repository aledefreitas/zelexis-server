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
 try {
     /**
      * ZLXServer Class
      *
      * Instances and starts the WebSocket server over HTTPS
      *
      * @var ZLXServer
      */
     var ZLXServer = require("./src/Server/ZLXServer.js");

     /**
      * Constant with HTTPS certificate credentials
      *
      * Reads from Process Line Arguments to determine the path to both the key and certificate files, respectively in order
      * And a third argument for a passphrase if there is one
      *
      * Example: node zlx-p2p-cdn-server.js PATH/TO/KEY/FILE PATH/TO/CERT/FILE PASSPHRASE
      *
      * $1 argument receives the key, $2 argument receives the cert, $3 argument receives the passphrase
      *
      * @const Object
      */
     const HTTPS_credentials = require('./ssl-credentials.js');

     /**
      * Constant with the port on which the server will listen to
      *
      * Uses port 8443 which is one of CloudFlare's proxies accepted
      *
      * @const int
      */
     const PORT = 8443;

     // Starts the server, listening to the given port
     new ZLXServer(HTTPS_credentials, PORT);
 } catch(e) {
     console.log("[ZELEXIS SERVER] Exited with Fatal Error: " + e);
     console.log(e.stack);
 }
