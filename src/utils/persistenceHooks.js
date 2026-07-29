/**
 * Request that a room's state be persisted.
 * Actual persistence will be implemented by B2.
 *
 * @param {string} roomId
 * @param {string} reason
 */
function requestRoomSave(roomId, reason) {

    console.log(
        `[PERSISTENCE] Save requested for room ${roomId} (${reason})`
    );

}

module.exports = {

    requestRoomSave

};