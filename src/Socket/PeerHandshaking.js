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

var PeerHandshaking = function PeerHandshaking() {
    var self = this;

    /**
     * Handles a new message from the Socket Connection, and routes it to the correspondent function
     *
     * @context Socket\User
     *
     * @return void
     */
    this.onMessage = function(msg) {
        try {
            let data = JSON.parse(msg.toString('utf8'));

            switch(data.req) {
                case 'request_pairs':
                    return self._requestPairs.call(this, data);
                break;

                case 'offer_pair':
                    return self._offerPair.call(this, data);
                break;

                case 'answer_pair':
                    return self._answerPair.call(this, data);
                break;

                case 'candidate_pair':
                    return self._candidatePair.call(this, data);
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
    this.onError = function(error) {
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
    this._requestPairs = function(data) {
        // If the request doesn't specify a filePath, we return immediately
        if(!data.filePath)
            return;

        let _filePath = PathParser.parse(data.filePath);

        // Joins the swarm for the given file
        this.ConnectionPool.join(_filePath, this);

        // Sends a message to the user with the current swarm size for the specified file
        this.send({
            'req': 'request_pairs',
            'swarm': _filePath,
            'size': this.ConnectionPool.getSwarmSize(this._domain, _filePath)
        });

        // Then we broadcast to everyone inside the swarm that we are available to pairing
        this.broadcast({
            'from': this.id,
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
    this._offerPair = function(data) {
        var User = this.ConnectionPool.get(data.to);

        if(!User) {
            return false;
        }

        User.send({
            'from': this.id,
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
    this._answerPair = function(data) {
        var User = this.ConnectionPool.get(data.to);

        if(!User) {
            return false;
        }

        User.send({
            'from': this.id,
            'req': 'pair_answer',
            'sdp': data.sdp
        });
    };

    this._candidatePair = function(data) {
        var User = this.ConnectionPool.get(data.to);

        if(!User) {
            return false;
        }

        User.send({
            'from': this.id,
            'req': 'pair_candidate',
            'candidate': data.candidate
        });
    };
};

module.exports = PeerHandshaking;
