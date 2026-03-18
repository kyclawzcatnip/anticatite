// ===== SUPER CAT WORLD — Network Manager (PeerJS WebRTC) =====
// Supports up to 4 players (1 host + 3 guests).
// Host manages multiple connections, each guest gets a slot (0=P2, 1=P3, 2=P4).

const NetworkManager = (function () {
    'use strict';

    let peer = null;
    let conns = [];            // array of connections (host: up to 3, guest: 1)
    let pendingConn = null;
    let isHost = false;
    let isPublic = false;
    let roomCode = '';
    let maxSlots = 1;          // max guest slots (1 for 2-player, 3 for 4-player)
    let onConnectCallback = null;
    let onDisconnectCallback = null;
    let onDataCallback = null;
    let onErrorCallback = null;
    let onConnectionRequestCallback = null;

    const PREFIX_PRIVATE = 'scw-mp-';
    const PREFIX_PUBLIC = 'scw-pub-';

    function generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    // Host: set up a connection in a specific slot
    function setupHostConnection(connection, slot) {
        conns[slot] = connection;
        if (connection.open) {
            if (onConnectCallback) onConnectCallback(slot);
        } else {
            connection.on('open', () => {
                if (onConnectCallback) onConnectCallback(slot);
            });
        }
        connection.on('data', (data) => {
            if (onDataCallback) onDataCallback(data, slot);
        });
        connection.on('close', () => {
            conns[slot] = null;
            if (onDisconnectCallback) onDisconnectCallback(slot);
        });
        connection.on('error', (err) => {
            console.error('Connection error (slot ' + slot + '):', err);
            if (onErrorCallback) onErrorCallback(err);
        });
    }

    // Guest: set up single connection to host
    function setupGuestConnection(connection) {
        conns[0] = connection;
        if (connection.open) {
            if (onConnectCallback) onConnectCallback(0);
        } else {
            connection.on('open', () => {
                if (onConnectCallback) onConnectCallback(0);
            });
        }
        connection.on('data', (data) => {
            if (onDataCallback) onDataCallback(data, 0);
        });
        connection.on('close', () => {
            conns[0] = null;
            if (onDisconnectCallback) onDisconnectCallback(0);
        });
        connection.on('error', (err) => {
            console.error('Connection error:', err);
            if (onErrorCallback) onErrorCallback(err);
        });
    }

    // Find next available slot for a new guest
    function nextFreeSlot() {
        for (let i = 0; i < maxSlots; i++) {
            if (!conns[i]) return i;
        }
        return -1;
    }

    function handleIncomingConnection(connection) {
        const slot = nextFreeSlot();
        if (slot === -1) {
            // No slots available
            try { connection.close(); } catch (e) { }
            return;
        }
        if (isPublic) {
            pendingConn = connection;
            pendingConn._slot = slot;
            if (onConnectionRequestCallback) {
                onConnectionRequestCallback(connection.peer, slot);
            }
        } else {
            setupHostConnection(connection, slot);
        }
    }

    function host(callbacks, publicMode, maxPlayers) {
        onConnectCallback = callbacks.onConnect || null;
        onDisconnectCallback = callbacks.onDisconnect || null;
        onDataCallback = callbacks.onData || null;
        onErrorCallback = callbacks.onError || null;
        onConnectionRequestCallback = callbacks.onConnectionRequest || null;

        roomCode = generateCode();
        isHost = true;
        isPublic = publicMode || false;
        maxSlots = (maxPlayers || 2) - 1; // 2-player = 1 slot, 4-player = 3 slots
        conns = new Array(maxSlots).fill(null);

        const prefix = isPublic ? PREFIX_PUBLIC : PREFIX_PRIVATE;
        const peerId = prefix + roomCode;

        return new Promise((resolve, reject) => {
            peer = new Peer(peerId, {
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            peer.on('open', (id) => {
                console.log('Hosting room:', roomCode, isPublic ? '(public)' : '(private)', 'max:', maxPlayers);
                resolve(roomCode);
            });

            peer.on('connection', (connection) => {
                handleIncomingConnection(connection);
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (err.type === 'unavailable-id') {
                    peer.destroy();
                    roomCode = generateCode();
                    const newId = prefix + roomCode;
                    peer = new Peer(newId, { debug: 0 });
                    peer.on('open', () => resolve(roomCode));
                    peer.on('connection', (c) => handleIncomingConnection(c));
                    peer.on('error', (e) => {
                        if (onErrorCallback) onErrorCallback(e);
                        reject(e);
                    });
                } else {
                    if (onErrorCallback) onErrorCallback(err);
                    reject(err);
                }
            });
        });
    }

    function acceptPending() {
        if (pendingConn) {
            const slot = pendingConn._slot !== undefined ? pendingConn._slot : nextFreeSlot();
            if (slot >= 0) {
                setupHostConnection(pendingConn, slot);
            }
            pendingConn = null;
        }
    }

    function denyPending() {
        if (pendingConn) {
            try { pendingConn.close(); } catch (e) { }
            pendingConn = null;
        }
    }

    function join(code, callbacks, isPublicRoom) {
        onConnectCallback = callbacks.onConnect || null;
        onDisconnectCallback = callbacks.onDisconnect || null;
        onDataCallback = callbacks.onData || null;
        onErrorCallback = callbacks.onError || null;

        roomCode = code.toUpperCase().trim();
        const prefix = isPublicRoom ? PREFIX_PUBLIC : PREFIX_PRIVATE;
        const peerId = prefix + 'g-' + roomCode + '-' + Math.floor(Math.random() * 10000);
        const hostId = prefix + roomCode;
        isHost = false;
        conns = [null];

        return new Promise((resolve, reject) => {
            peer = new Peer(peerId, {
                debug: 0,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            peer.on('open', () => {
                const connection = peer.connect(hostId, { reliable: true });
                setupGuestConnection(connection);

                const timeout = setTimeout(() => {
                    if (!conns[0] || !conns[0].open) {
                        reject(new Error(isPublicRoom ? 'Waiting for host approval...' : 'Connection timed out. Check the room code.'));
                        if (!isPublicRoom) disconnect();
                    }
                }, isPublicRoom ? 30000 : 15000);

                const origConnect = onConnectCallback;
                onConnectCallback = (slot) => {
                    clearTimeout(timeout);
                    if (origConnect) origConnect(slot);
                    resolve();
                };
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (onErrorCallback) onErrorCallback(err);
                reject(err);
            });
        });
    }

    // List public rooms via HTTP fetch
    async function listPublicRooms() {
        const urls = [
            'https://0.peerjs.com/peerjs/peers',
            'https://0.peerjs.com/peers',
            'https://0.peerjs.com/peerjs/peers?key=peerjs'
        ];
        for (const url of urls) {
            try {
                const resp = await fetch(url, { signal: AbortSignal.timeout(4000) });
                if (resp.ok) {
                    const peers = await resp.json();
                    if (Array.isArray(peers)) {
                        return peers
                            .filter(id => typeof id === 'string' && id.startsWith(PREFIX_PUBLIC) && !id.includes('-g-'))
                            .map(id => id.replace(PREFIX_PUBLIC, ''));
                    }
                }
            } catch (e) { }
        }
        // Fallback
        try {
            return await new Promise((resolve) => {
                const tempPeer = new Peer({ debug: 0 });
                const timer = setTimeout(() => { try { tempPeer.destroy(); } catch (e) { } resolve([]); }, 5000);
                tempPeer.on('open', () => {
                    try {
                        tempPeer.listAllPeers((peers) => {
                            clearTimeout(timer);
                            const rooms = (peers || [])
                                .filter(id => id.startsWith(PREFIX_PUBLIC) && !id.includes('-g-'))
                                .map(id => id.replace(PREFIX_PUBLIC, ''));
                            try { tempPeer.destroy(); } catch (e) { }
                            resolve(rooms);
                        });
                    } catch (e) { clearTimeout(timer); try { tempPeer.destroy(); } catch (e2) { } resolve([]); }
                });
                tempPeer.on('error', () => { clearTimeout(timer); try { tempPeer.destroy(); } catch (e) { } resolve([]); });
            });
        } catch (e) { return []; }
    }

    // Send to all connected guests (host) or to host (guest)
    function send(data) {
        for (let i = 0; i < conns.length; i++) {
            if (conns[i] && conns[i].open) {
                try { conns[i].send(data); } catch (e) { console.warn('Send error slot ' + i, e); }
            }
        }
    }

    // Send to a specific slot
    function sendTo(slot, data) {
        if (conns[slot] && conns[slot].open) {
            try { conns[slot].send(data); } catch (e) { console.warn('SendTo error slot ' + slot, e); }
        }
    }

    function disconnect() {
        if (pendingConn) { try { pendingConn.close(); } catch (e) { } pendingConn = null; }
        for (let i = 0; i < conns.length; i++) {
            if (conns[i]) { try { conns[i].close(); } catch (e) { } }
        }
        conns = [];
        if (peer) { try { peer.destroy(); } catch (e) { } peer = null; }
        isHost = false;
        isPublic = false;
        roomCode = '';
        maxSlots = 1;
    }

    function connectedCount() {
        let count = 0;
        for (let i = 0; i < conns.length; i++) {
            if (conns[i] && conns[i].open) count++;
        }
        return count;
    }

    return {
        host,
        join,
        send,
        sendTo,
        disconnect,
        acceptPending,
        denyPending,
        listPublicRooms,
        connectedCount,
        get isHost() { return isHost; },
        get isConnected() { return conns.some(c => c && c.open); },
        get isPublic() { return isPublic; },
        get roomCode() { return roomCode; },
        get isActive() { return peer !== null; },
        get hasPending() { return pendingConn !== null; },
        get maxSlots() { return maxSlots; }
    };
})();
