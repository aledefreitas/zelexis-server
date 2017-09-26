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

var PathSwarmPool = require("./PathSwarmPool.js");

var ConnectionPool = function ConnectionPool() {
    /**
     * Variable containing the map of domains for this connections pool
     *
     * @var Map
     */
    this._domains = null;

    /**
     * Variable containing the map for connections
     *
     * @var Object
     */
    this._connections = {};

    /**
     * Constructor method for ConnectionPool
     *
     * @return self
     */
    this.constructor = function() {
        this._domains = new Map();
        this._connections = {};

        return this;
    };

    /**
     * Adds a user to the connections pool
     *
     * @param   Socket\User     user        User
     *
     * @return  string                      Returns user's id
     */
    this.add = function(user) {
        this._connections[user.id] = user;

        return user.id;
    };

    /**
     * Makes a user join a certain swarm, creates it if it doesn't exist
     *
     * @param   string          swarm       Swarm on which to join
     * @param   Socket\User     user        User
     *
     * @return void
     */
    this.join = function(swarm, user) {
        // If the user's connection hasn't been added to the connection pool yet, we add it
        if(!this._connections[user.id])
            this._connections[user.id] = user;

        if(!this._domains.get(user._domain))
            this._domains.set(user._domain, new PathSwarmPool());

        let _swarms = this._domains.get(user._domain);

        _swarms.join(swarm, user);
    };

    /**
     * Deletes a user by its id from a swarm, and if there are no other users inside, deletes the swarm
     *
     * @param   string      swarm       Swarm to leave
     * @param   string      user_id     User identification
     *
     * @return boolean
     */
    this.leave = function(swarm, user_id) {
        let user = this._connections[user_id];

        // If the user didn't join any swarms or did not join this swarm, return immediately
        if(!user._swarms || !user._swarms.has(swarm))
            return;

        let _swarms = this._domains.get(user._domain);

        // Tries to make the user leave the swarm
        if(_swarms.leave(swarm, user_id)) {
            // Deletes the swarm from user's swarms joined list
            user._swarms.delete(swarm);

            // If after the user leaves the swarm, the entire domain is empty, we delete it from the Pool
            if(_swarms.size == 0) {
                this._domains.delete(user._domain);
            }

            return true;
        }

        return false;
    };

    /**
     * Returns the size for a swarm inside the domain
     *
     * @param   string      domain          Domain
     * @param   string      swarm           Swarm to check
     *
     * @return int
     */
    this.getSwarmSize = function(domain, swarm) {
        let swarmSet = this.in(domain, swarm);

        if(!swarmSet)
            return 0;

        return swarmSet.size - 1 > 0 ? swarmSet.size - 1 : 0;
    };

    /**
     * Returns the Set of users inside a swarm
     *
     * @param   string      domain      Domain to search for swarms
     * @param   string      swarm       Swarm to search for users
     *
     * @return  Set
     */
    this.in = function(domain, swarm) {
        let _swarms = this._domains.get(domain);

        // If the domain doesn't exist, return an empty Set
        if(!_swarms)
            return new Set();

        let _swarmSet = _swarms.get(swarm);

        return _swarmSet ? _swarmSet : new Set();
    };

    /**
     * Deletes a user from the Pool
     *
     * @param   string      user_id         User's identity
     *
     * @return void
     */
    this.delete = function(user_id) {
        delete this._connections[user_id];
    };

    /**
     * Returns a specific user object inside the connection pool
     *
     * @param   string      user_id         User identification
     *
     * @return Socket\User
     */
    this.get = function(user_id) {
        return this._connections[user_id];
    };

    // Returns the constructor method
    return this.constructor();
};

module.exports = ConnectionPool;
