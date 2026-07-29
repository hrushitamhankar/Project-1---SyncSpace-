/**
 * Stores last execution timestamps.
 */
const throttleStore = new Map();

/**
 * Checks whether an event should be throttled.
 *
 * @param {string} key
 * @param {number} delay
 * @returns {boolean}
 */
function shouldThrottle(key, delay) {

    const now = Date.now();

    const lastTime =
        throttleStore.get(key) || 0;

    if (now - lastTime < delay) {
        return true;
    }

    throttleStore.set(key, now);

    return false;
}

/**
 * Clears throttle entry.
 *
 * @param {string} key
 */
function clearThrottle(key) {

    throttleStore.delete(key);

}

module.exports = {

    shouldThrottle,

    clearThrottle

};