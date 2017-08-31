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
            let data = JSON.parse(msg);

            switch(data.req) {
                case 'request_pairs':
                    return self._requestPairs.call(this);
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
     * Sends a Broadcast message requesting to pair with someone
     *
     * @return void
     */
    this._requestPairs = function() {
        // Here the context is Socket\User, so we're calling the broadcast method from the User's class
        this.broadcast({
            'from': this.id,
            'req': 'pair_found'
        });
    };

    /**
     * Offers a pair to a single peer
     *
     * @param   Object      data            Offer data
     *
     * @return void
     */
    this._offerPair = function(data) {
        this.ConnectionPool.get(data.to).send({
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
        this.ConnectionPool.get(data.to).send({
            'from': this.id,
            'req': 'pair_answer',
            'sdp': data.sdp
        });
    };

    this._candidatePair = function(data) {
        this.ConnectionPool.get(data.to).send({
            'from': this.id,
            'req': 'pair_candidate',
            'candidate': data.candidate
        });
    };
};

module.exports = SocketEventHandler;
