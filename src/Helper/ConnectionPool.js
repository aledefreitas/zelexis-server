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

var ConnectionPool = function ConnectionPool() {
    /**
     * Variable containing the map of rooms for this connections pool
     *
     * @var Map
     */
    this._rooms = null;

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
        this._rooms = new Map();
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
     * Makes a user join a certain room, creates it if it doesn't exist
     *
     * @param   string          room        Room on which to join
     * @param   Socket\User     user        User
     *
     * @return void
     */
    this.join = function(room, user) {
        // If the user object doesn't have any rooms in it, create a Set for it
        user._joinedRooms = user._joinedRooms || new Set();

        // If there are no rooms with this name available, create it
        if(!this._rooms.get(room))
            this._rooms.set(room, new Set());

        // If the user isn't inside the room yet, we make him join it
        if(!this._rooms.get(room).has(user.id)) {
            this._rooms.get(room).add(user.id);
            user._joinedRooms.add(room);
        }

        // If the user's connection hasn't been added to the connection pool yet, we add it
        if(!this._connections[user.id])
            this._connections[user.id] = user;
    };

    /**
     * Deletes a user by its id from a room, and if there are no other users inside, deletes the room
     *
     * @param   string      room        Room to leave
     * @param   string      user_id     User identification
     *
     * @return void
     */
    this.leave = function(room, user_id) {
        let user = this._connections[user_id];

        // If the user didn't join any rooms or did not join this room, return immediately
        if(!user._joinedRooms || !user._joinedRooms.has(room))
            return;

        let _roomEntries = this._rooms.get(room);

        if(_roomEntries) {
            _roomEntries.delete(user_id);
        }

        if(this._rooms.get(room).size == 0)
            this._rooms.delete(room);
    };

    /**
     * Returns the Map of users inside a room
     *
     * @param   string      room        Room to search for users
     *
     * @return  Set
     */
    this.in = function(room) {
        // If the room doesn't exist, return an empty Map
        if(!this._rooms.get(room))
            return new Set();

        return this._rooms.get(room);
    };

    /**
     * Deletes a user from
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
