const metrics = {
    activeRooms: 0,
    activeUsers: 0,
    awarenessUpdates: 0,
    reconnects: 0
};

export function increment(metric) {
    if (metrics[metric] !== undefined) {
        metrics[metric]++;
    }
}

export function decrement(metric) {
    if (metrics[metric] !== undefined && metrics[metric] > 0) {
        metrics[metric]--;
    }
}

export function getMetrics() {
    return { ...metrics };
}