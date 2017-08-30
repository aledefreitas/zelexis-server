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

var SocketEventHandler = function SocketEventHandler() {
    this.onMessage = function(msg) {
        console.log(msg);
    };

    this.onError = function(error) {

    };
};

module.exports = SocketEventHandler;
