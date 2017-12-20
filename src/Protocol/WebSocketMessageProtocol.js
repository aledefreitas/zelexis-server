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

var Buffer = require("safe-buffer").Buffer;
var EventEmitter = require("events").EventEmitter;
var inherits = require("inherits");

// Inherits EventEmitter object
inherits(WebSocketMessageProtocol, EventEmitter);

/**
 * @constructor
 */
function WebSocketMessageProtocol() {
    EventEmitter.call(this);

    /**
     * Code for incoming request types
     *
     * @var {object}
     */
    this.INCOMING = {
        'JOIN_SWARM': Buffer.from([ 0x00, 0x01 ]),
        'LOCAL_PEER_OFFER': Buffer.from([ 0x00, 0x02 ]),
        'LOCAL_PEER_ANSWER': Buffer.from([ 0x00, 0x03 ]),
        'LOCAL_ICE_CANDIDATE': Buffer.from([ 0x00, 0x04 ]),
    };

    /**
     * Code for outgoing response types
     *
     * @var {object}
     */
    this.OUTGOING = {
        'REMOTE_PEER': Buffer.from([ 0x01, 0x01 ]),
        'REMOTE_PEER_OFFER': Buffer.from([ 0x01, 0x02 ]),
        'REMOTE_PEER_ANSWER': Buffer.from([ 0x01, 0x03 ]),
        'ICE_CANDIDATE': Buffer.from([ 0x01, 0x04 ]),
        'IDENTITY': Buffer.from([ 0x01, 0x05 ]),
        'SWARM_DATA': Buffer.from([ 0x01, 0x06 ]),
        'PEER_DISCONNECTED': Buffer.from([ 0x01, 0x07 ]),
    };

    this.on("message", _onMessageReceived.bind(this));
};


/**
 * Writes a message to the pattern used in our WebSocket server
 *
 * @param   {hex}         req             Request to send
 * @param   {object}      data            Data to send with the request
 *
 * @return  {Blob}
 */
WebSocketMessageProtocol.prototype.write = function(req, data) {
    try {
        if(!Buffer.isBuffer(req))
            throw("Trying to send an invalid request to the WebSocket Client");

        var string_data = JSON.stringify(data);
        var buf = Buffer.from(string_data);

        if(data) {
            return Buffer.concat([
                req,
                buf
            ]);
        }

        return req;
    } catch(e) {
        // @TODO: Utilizar uma classe de logging/debugging
        console.log(e);
    }
};

/**
 * Reads the message from the websocket server
 *
 * @param   {Buffer}        buffer
 *
 * @return  {object}
 */
WebSocketMessageProtocol.prototype.read = function(buffer) {
    try {
        var reqBuff = buffer.slice(0, 2);
        var data = null;

        if(buffer.length > 2)
            data = JSON.parse(buffer.slice(2));

        return {
            req: Buffer.from(reqBuff),
            data: data
        };
    } catch(e) {
        console.log(e);
    }
};

/**
 * Handles a new message received from the WebSocket, and then emits an event according to the received message
 *
 * @param   {Buffer}    message
 *
 * @return {void}
 */
function _onMessageReceived(message) {
    var msgData = this.read(message);

    if(!message)
        return;

    var reqBuff = Buffer.from(msgData.req);

    if(reqBuff.equals(this.INCOMING.JOIN_SWARM)) {
        console.log('join_swarm received from client ', msgData.data);
        this.emit('join_swarm', msgData.data);
    }

    if(reqBuff.equals(this.INCOMING.LOCAL_PEER_OFFER)) {
        console.log('local_peer_offer received from client ', msgData.data);
        this.emit('local_peer_offer', msgData.data);
    }

    if(reqBuff.equals(this.INCOMING.LOCAL_PEER_ANSWER)) {
        console.log('local_peer_answer received from client ', msgData.data);
        this.emit('local_peer_answer', msgData.data);
    }

    if(reqBuff.equals(this.INCOMING.LOCAL_ICE_CANDIDATE)) {
        console.log('local_ice_candidate received from client ', msgData.data);
        this.emit('local_ice_candidate', msgData.data);
    }

    return;
}

module.exports = WebSocketMessageProtocol;
