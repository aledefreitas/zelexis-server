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
        if(!handshake.req.url.match(/\?\_accessKey\=(\w{5})/gi))
            throw new Error("Invalid access key");

        //TODO: Fazer autenticação complexa utilizando o host, origin para fazer uma real autenticação do domínio do cliente
        //TODO: Utilizar gearman para acesso multithread ao banco de dados para realizar checagens de pares de chave de acesso + domain do cliente
        //TODO: Enviar chave de acesso do cliente junto dos headers de conexão do servidor de WebSocket
        console.log(handshake.req.url);
        return accept(true);
    } catch(e) {
        console.log(e);
        return accept(false, 401, e.message);
    }
};

module.exports = Authentication;
