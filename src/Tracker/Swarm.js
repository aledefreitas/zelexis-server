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

var Swarm = function Swarm(_metadata) {
    /**
     * Object containing metadata about the file
     *
     * @var Object
     */
    this._metadata = {};

    /**
     * Set of peers connected to this swarm
     *
     * @var Set
     */
    this._peers = null;

    /**
     * Constructor method for Swarm
     *
     * @param   object      metadata        File metadata
     *
     * @return void
     */
    this.constructor = function(metadata) {
        if(typeof(metadata) == "object") {
            this._metadata = metadata;
        }

        this._peers = new Set();
    };

    /**
     * Returns the peers connected to this swarm
     *
     * @return Set
     */
    this.getPeers = function() {
        return this._peers;
    };

    /**
     * Returns the File Metadata for this swarm
     *
     * @return Object
     */
    this.getMetadata = function() {
        return this._metadata;
    };

    /**
     * Sets the metadata for this Swarm
     *
     * @param   object      metadata        File metadata
     *
     * @return void
     */
    this.setMetadata = function(metadata) {
        this._metadata = metadata;
    };

    /**
     * Makes a user join this swarm
     *
     * @param   string      user_id         User's identity
     *
     * @return void
     */
    this.join = function(user_id) {
        if(!this.has(user_id))
            this._peers.add(user_id);
    };

    /**
     * Makes a user leave the swarm
     *
     * @param   string      user_id         User's identity
     *
     * @return boolean
     */
    this.leave = function(user_id) {
        if(!this.has(user_id))
            return false;

        this._peers.delete(user_id);

        return true;
    };

    /**
     * Returns whether there is a specific user or not in this swarm
     *
     * @param   string      user_id         User's identity
     *
     * @return boolean
     */
    this.has = function(user_id) {
        return this._peers.has(user_id);
    };

    /**
     * Returns the current number of peers inside this swarm
     *
     * @return int
     */
    this._getSize = function() {
        return this._peers.size;
    };

    /**
     * Defines the property size for SwarmPool instances, which calls _getSize() as its value
     */
    Object.defineProperty(this, "size", {
        get: function() {
            return this._getSize();
        }
    });

    return this.constructor(_metadata);
};

module.exports = Swarm;
