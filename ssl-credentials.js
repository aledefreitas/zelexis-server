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
var fs = require("fs");

/**
 * Exports the SSL credentials needed for
 */
module.exports = {
    "key": fs.readFileSync("/etc/nginx/conf.d/ssl/ssls.com/zlx.key"),
    "cert": fs.readFileSync("/etc/nginx/conf.d/ssl/ssls.com/zlx.com.br-bundle.crt"),
    "passphrase": null
};
