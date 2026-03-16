// ===== SUPER CAT WORLD — Network Manager (PeerJS WebRTC) =====
// Handles peer-to-peer online multiplayer via PeerJS.
// Public rooms use 'scw-pub-' prefix (discoverable via listAllPeers).
// Private rooms use 'scw-mp-' prefix (need code to join).

const NetworkManager = (function () {
    'use strict';

    let peer = null;
    let conn = null;
    let pendingConn = null;
    let isHost = false;
    let isConnected = false;
    let isPublic = false;
    let roomCode = '';
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

    function setupConnection(connection) {
        conn = connection;
        // If connection is already open, fire callback immediately
        if (conn.open) {
            isConnected = true;
            if (onConnectCallback) onConnectCallback();
        } else {
            conn.on('open', () => {
                isConnected = true;
                if (onConnectCallback) onConnectCallback();
            });
        }
        conn.on('data', (data) => {
            if (onDataCallback) onDataCallback(data);
        });
        conn.on('close', () => {
            isConnected = false;
            conn = null;
            if (onDisconnectCallback) onDisconnectCallback();
        });
        conn.on('error', (err) => {
            console.error('Connection error:', err);
            if (onErrorCallback) onErrorCallback(err);
        });
    }

    function host(callbacks, publicMode) {
        onConnectCallback = callbacks.onConnect || null;
        onDisconnectCallback = callbacks.onDisconnect || null;
        onDataCallback = callbacks.onData || null;
        onErrorCallback = callbacks.onError || null;
        onConnectionRequestCallback = callbacks.onConnectionRequest || null;

        roomCode = generateCode();
        isHost = true;
        isPublic = publicMode || false;
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
                console.log('Hosting room:', roomCode, isPublic ? '(public)' : '(private)');
                resolve(roomCode);
            });

            peer.on('connection', (connection) => {
                if (isPublic) {
                    // Public: hold connection, ask host for approval
                    pendingConn = connection;
                    if (onConnectionRequestCallback) {
                        onConnectionRequestCallback(connection.peer);
                    }
                } else {
                    // Private: auto-accept
                    setupConnection(connection);
                }
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (err.type === 'unavailable-id') {
                    peer.destroy();
                    roomCode = generateCode();
                    const newId = prefix + roomCode;
                    peer = new Peer(newId, { debug: 0 });
                    peer.on('open', () => resolve(roomCode));
                    peer.on('connection', (c) => {
                        if (isPublic) {
                            pendingConn = c;
                            if (onConnectionRequestCallback) onConnectionRequestCallback(c.peer);
                        } else {
                            setupConnection(c);
                        }
                    });
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
            setupConnection(pendingConn);
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
                setupConnection(connection);

                const timeout = setTimeout(() => {
                    if (!isConnected) {
                        reject(new Error(isPublicRoom ? 'Waiting for host approval...' : 'Connection timed out. Check the room code.'));
                        if (!isPublicRoom) disconnect();
                    }
                }, isPublicRoom ? 30000 : 15000); // Longer timeout for public (waiting for approval)

                const origConnect = onConnectCallback;
                onConnectCallback = () => {
                    clearTimeout(timeout);
                    if (origConnect) origConnect();
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

    // List public rooms — tries HTTP fetch, then peer-based fallback
    async function listPublicRooms() {
        // Try direct HTTP fetch to PeerJS cloud server API
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
            } catch (e) { /* try next URL */ }
        }

        // Fallback: use PeerJS peer object
        try {
            return await new Promise((resolve) => {
                const tempPeer = new Peer({ debug: 0 });
                const timer = setTimeout(() => {
                    try { tempPeer.destroy(); } catch (e) { }
                    resolve([]);
                }, 5000);

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
                    } catch (e) {
                        clearTimeout(timer);
                        try { tempPeer.destroy(); } catch (e2) { }
                        resolve([]);
                    }
                });
                tempPeer.on('error', () => {
                    clearTimeout(timer);
                    try { tempPeer.destroy(); } catch (e) { }
                    resolve([]);
                });
            });
        } catch (e) {
            return [];
        }
    }

    function send(data) {
        if (conn && conn.open) {
            try {
                conn.send(data);
            } catch (e) {
                console.warn('Send error:', e);
            }
        }
    }

    function disconnect() {
        if (pendingConn) { try { pendingConn.close(); } catch (e) { } pendingConn = null; }
        if (conn) { try { conn.close(); } catch (e) { } conn = null; }
        if (peer) { try { peer.destroy(); } catch (e) { } peer = null; }
        isConnected = false;
        isHost = false;
        isPublic = false;
        roomCode = '';
    }

    return {
        host,
        join,
        send,
        disconnect,
        acceptPending,
        denyPending,
        listPublicRooms,
        get isHost() { return isHost; },
        get isConnected() { return isConnected; },
        get isPublic() { return isPublic; },
        get roomCode() { return roomCode; },
        get isActive() { return peer !== null; },
        get hasPending() { return pendingConn !== null; }
    };
})();
