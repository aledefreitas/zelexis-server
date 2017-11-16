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

var Swarm = require("./Swarm.js");

/**
 * Constructor for the SwarmPool
 * Instantiates a Map for its swarms object
 *
 * @return void
 */
var SwarmPool = function SwarmPool() {
    /**
     * Variable containing all swarms for this Pool
     *
     * @var Map
     */
    this._swarms = new Map();
};

/**
 * Returns a specific swarm
 *
 * @param   string      swarm       Swarm to check
 *
 * @return Set
 */
SwarmPool.prototype.get = function(swarm) {
    return this._swarms.get(swarm);
};

/**
 * Makes a user join a swarm
 *
 * @param   string          swarm       Swarm to join
 * @param   Socket\User     user        User object
 *
 * @return void
 */
SwarmPool.prototype.join = function(swarm, user) {
    // If the user object doesn't have any swarms in it, create a Set for it
    user._swarms = user._swarms || new Set();

    // If there are no swarms with this name available, create it
    if(!this._swarms.has(swarm))
        this._swarms.set(swarm, new Swarm());

    let swarmSet = this._swarms.get(swarm);

    // If the user isn't already inside the swarm, add him
    if(!swarmSet.has(user.id)) {
        swarmSet.join(user.id);
        user._swarms.add(swarm);
    }
}

/**
 * Makes a user leave a specific swarm
 *
 * @param   string      swarm           Swarm to leave
 * @param   string      user_id         User's identity
 *
 * @return boolean
 */
SwarmPool.prototype.leave = function(swarm, user_id) {
    let swarmSet = this._swarms.get(swarm);

    if(swarmSet && swarmSet.leave(user_id)) {
        if(swarmSet.size == 0) {
            this._swarms.delete(swarm);
        }

        return true;
    }

    return false;
};

/**
 * Returns the current number of swarms active
 *
 * @return int
 */
SwarmPool.prototype._getSize = function() {
    return this._swarms.size;
}

/**
 * Defines the property size for SwarmPool instances, which calls _getSize() as its value
 */
Object.defineProperty(SwarmPool, "size", {
    get: function() {
        return this._getSize();
    }
});

module.exports = SwarmPool;
