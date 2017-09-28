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

var exports = module.exports = {};

/**
 * Parses a path removing query strings and hashes
 *
 * @param   string      path
 *
 * @return string
 */
exports.parse = function(path) {
    return path.replace(/\?(.*)/, "").replace(/\#(.*)/, "");
};
