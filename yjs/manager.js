const {
    getDocument
} = require("./documentManager");

const {
    getAwareness
} = require("./awareness");

/**
 * Initialize a collaborative room.
 */
function initializeRoom(roomId) {

    const doc = getDocument(roomId);

    return {
        doc,
        awareness: getAwareness(roomId)
    };

}

module.exports = {
    initializeRoom
};