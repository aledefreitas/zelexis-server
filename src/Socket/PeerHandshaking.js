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

var ConnectionPool = require("../Tracker/ConnectionPool.js");
var PathParser = require("../Helper/PathParser.js");

/**
 * PeerHandshaking constructor
 *
 * @param   {string}                      user_id             User's id
 *
 * @return {void}
 */
var PeerHandshaking = function PeerHandshaking(user_id, WSMProtocol) {
    this.User = ConnectionPool.get(user_id);

    this.WSMProtocol = this.User.WSMProtocol;

    // Sends the identity to the user
    this.User.send(this.WSMProtocol.write(
        this.WSMProtocol.OUTGOING.IDENTITY,
        user_id
    ));

    this.WSMProtocol.on('join_swarm', joinSwarm.bind(this));
    this.WSMProtocol.on('local_peer_offer', localPeerOffer.bind(this));
    this.WSMProtocol.on('local_peer_answer', localPeerAnswer.bind(this));
    this.WSMProtocol.on('local_ice_candidate', localIceCandidate.bind(this));
};

/**
 * Requests to join a specific swarm
 *
 * @param   {object}      data        Request data
 *
 * @return {void}
 */
function joinSwarm(data) {
    // If the request doesn't specify a filePath, we return immediately
    if(!data.filePath)
        return;

    let swarm_id = PathParser.parse(data.filePath);

    // Joins the swarm for the given file
    ConnectionPool.join(swarm_id, this.User);

    // We send the data about the swarm to the User
    this.User.send(this.WSMProtocol.write(
        this.WSMProtocol.OUTGOING.SWARM_DATA,
        {
            'filePath': data.filePath,
            'swarm_id': swarm_id,
            'size': ConnectionPool.getSwarmSize(this.User._domain, swarm_id)
        }
    ));

    // Then we broadcast to everyone inside the swarm that we are available to pairing
    this.User.broadcast(this.WSMProtocol.write(
        this.WSMProtocol.OUTGOING.REMOTE_PEER,
        {
            'from': this.User.id,
            'swarm_id': swarm_id
        }
    ), swarm_id);
};

/**
 * Offers a pair to a single peer
 *
 * @param   {object}      data            Offer data
 *
 * @return {void}
 */
function localPeerOffer(data) {
    // If the remote peer is not specified, just return
    if(!data.to)
        return;

    let User = ConnectionPool.get(data.to);

    // If the user is not connected to the server, return
    if(!User)
        return;

    // Send the remote peer data about the user
    User.send(this.WSMProtocol.write(
        this.WSMProtocol.OUTGOING.REMOTE_PEER_OFFER,
        {
            'from': this.User.id,
            'swarm_id': data.swarm_id,
            'sdp': data.sdp
        }
    ));
};

/**
* Answers a pair
 *
 * @param   {object}      data            Offer data
 *
 * @return {void}
 */
function localPeerAnswer(data) {
    // If the remote peer is not specified, just return
    if(!data.to)
        return;

    let User = ConnectionPool.get(data.to);

    // If the user is not connected to the server, return
    if(!User)
        return;

    // Send the remote peer data about the user
    User.send(this.WSMProtocol.write(
        this.WSMProtocol.OUTGOING.REMOTE_PEER_ANSWER,
        {
            'from': this.User.id,
            'swarm_id': data.swarm_id,
            'sdp': data.sdp
        }
    ));
};

/**
 * Sends the information about the ICE Candidate to the respective peer
 *
 * @param   {object}    data        ICE Candidate info
 *
 * @return {void}
 */
function localIceCandidate(data) {
    // If the remote peer is not specified, just return
    if(!data.to)
        return;

    let User = ConnectionPool.get(data.to);

    // If the user is not connected to the server, return
    if(!User)
        return;

    // Send the remote peer data about the user
    User.send(this.WSMProtocol.write(
        this.WSMProtocol.OUTGOING.ICE_CANDIDATE,
        {
            'from': this.User.id,
            'swarm_id': data.swarm_id,
            'sdp': data.candidate
        }
    ));
};

module.exports = PeerHandshaking;
