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

var PathParser = require("../Helper/PathParser.js");

/**
 * PeerHandshaking constructor
 *
 * @param   string                      user_id             User's id
 * @param   Tracker\ConnectionPool      ConnectionPool      ConnectionPool instance
 *
 * @return void
 */
var PeerHandshaking = function PeerHandshaking(user_id, ConnectionPool) {
    this.User = ConnectionPool.get(user_id);
};

/**
 * Handles a new message from the Socket Connection, and routes it to the correspondent function
 *
 * @context Socket\User
 *
 * @return void
 */
PeerHandshaking.prototype.onMessage = function(msg) {
    try {
        let data = JSON.parse(msg.toString('utf8'));

        var reqs = {
            'JOIN_SWARM': 1,
            'LOCAL_PEER_OFFER': 2,
            'LOCAL_PEER_ANSWER': 3,
            'LOCAL_ICE_CANDIDATE': 4
        };

        switch(data.req) {
            case reqs.JOIN_SWARM:
                return this._requestPairs.call(this, data.data);
            break;

            case reqs.LOCAL_PEER_OFFER:
                return this._offerPair.call(this, data.data);
            break;

            case reqs.LOCAL_PEER_ANSWER:
                return this._answerPair.call(this, data.data);
            break;

            case reqs.LOCAL_ICE_CANDIDATE:
                return this._candidatePair.call(this, data.data);
            break;
        }
    } catch (e) {
        console.log(e);
    }
};

/**
 * Whenever there's an error in a communication to the socket, it terminates
 *
 * @param   Object      error               Error Object
 *
 * @return void
 */
PeerHandshaking.prototype.onError = function(error) {
    console.log(error);

    this.terminate();
};

/**
 * Requests pairs for a given file
 *
 * @param   object      data        Request data
 *
 * @return void
 */
PeerHandshaking.prototype._requestPairs = function(data) {
    // If the request doesn't specify a filePath, we return immediately
    if(!data.filePath)
        return;

    let _filePath = PathParser.parse(data.filePath);

    // Joins the swarm for the given file
    this.User.ConnectionPool.join(_filePath, this.User);

    // Sends a message to the user with the current swarm size for the specified file
    this.User.send({
        'req': 'request_pairs',
        'swarm': _filePath,
        'size': this.User.ConnectionPool.getSwarmSize(this._domain, _filePath)
    });

    // Then we broadcast to everyone inside the swarm that we are available to pairing
    this.User.broadcast({
        'from': this.User.id,
        'req': 'pair_found'
    }, _filePath);
};

/**
 * Offers a pair to a single peer
 *
 * @param   Object      data            Offer data
 *
 * @return void
 */
PeerHandshaking.prototype._offerPair = function(data) {
    var User = this.User.ConnectionPool.get(data.to);

    if(!User) {
        return false;
    }

    User.send({
        'from': this.User.id,
        'req': 'pair_offer',
        'sdp': data.sdp
    });
};

/**
 * Answers a pair
 *
 * @param   Object      data            Answer data
 *
 * @return void
 */
PeerHandshaking.prototype._answerPair = function(data) {
    var User = this.User.ConnectionPool.get(data.to);

    if(!User) {
        return false;
    }

    User.send({
        'from': this.User.id,
        'req': 'pair_answer',
        'sdp': data.sdp
    });
};

/**
 * Sends a ICE Candidate info to the respective peer
 *
 * @param   Object      data        ICE Candidate info
 *
 * @return void
 */
PeerHandshaking.prototype._candidatePair = function(data) {
    var User = this.User.ConnectionPool.get(data.to);

    if(!User) {
        return false;
    }

    User.send({
        'from': this.User.id,
        'req': 'pair_candidate',
        'candidate': data.candidate
    });
};

module.exports = PeerHandshaking;
