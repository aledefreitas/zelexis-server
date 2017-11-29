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

/**
 * Function for client handshake authentication within the server
 * Used as 'verifyClient' parameter on our WebSocket Server
 *
 * @see https://github.com/websockets/ws/blob/master/doc/ws.md
 *
 * @param   Object      handshake   Handshake info
 * @param   Function    accept      WebSocket
 */
var Authentication = function Authentication(handshake, accept) {
    try {
        // Checks for the access key to have the right length
        if(handshake.req.headers['sec-websocket-protocol'].length !== 5)
            throw new Error("Invalid access key");

        //TODO: Fazer autenticação complexa utilizando o host, origin para fazer uma real autenticação do domínio do cliente
        //TODO: Utilizar gearman para acesso multithread ao banco de dados para realizar checagens de pares de chave de acesso + domain do cliente
        //TODO: Enviar chave de acesso do cliente junto dos headers de conexão do servidor de WebSocket
        //console.log(handshake.req.url);

        return accept(true);
    } catch(e) {
        return accept(false, 401, e.message);
    }
};

module.exports = Authentication;
