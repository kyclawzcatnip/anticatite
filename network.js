// ===== SUPER CAT WORLD — Network Manager (PeerJS WebRTC) =====
// Handles peer-to-peer online multiplayer via PeerJS.
// Host creates a room code, guest joins with it.
// Supports public (approval) and private (auto-join) rooms.

const NetworkManager = (function () {
    'use strict';

    let peer = null;
    let conn = null;
    let pendingConn = null; // pending connection waiting for host approval (public mode)
    let isHost = false;
    let isConnected = false;
    let isPublic = false;
    let roomCode = '';
    let onConnectCallback = null;
    let onDisconnectCallback = null;
    let onDataCallback = null;
    let onErrorCallback = null;
    let onConnectionRequestCallback = null; // public mode: host gets notified of join request

    const ROOM_PREFIX = 'scw-mp-';

    function generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    function setupConnection(connection) {
        conn = connection;
        conn.on('open', () => {
            isConnected = true;
            if (onConnectCallback) onConnectCallback();
        });
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
        const peerId = ROOM_PREFIX + roomCode;
        isHost = true;
        isPublic = publicMode || false;

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
                console.log('Hosting room:', roomCode, publicMode ? '(public)' : '(private)');
                resolve(roomCode);
            });

            peer.on('connection', (connection) => {
                if (isPublic) {
                    // Public mode: hold connection and ask host for approval
                    pendingConn = connection;
                    if (onConnectionRequestCallback) {
                        onConnectionRequestCallback(connection.peer);
                    }
                } else {
                    // Private mode: auto-accept
                    setupConnection(connection);
                }
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                if (err.type === 'unavailable-id') {
                    peer.destroy();
                    roomCode = generateCode();
                    const newId = ROOM_PREFIX + roomCode;
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

    function join(code, callbacks) {
        onConnectCallback = callbacks.onConnect || null;
        onDisconnectCallback = callbacks.onDisconnect || null;
        onDataCallback = callbacks.onData || null;
        onErrorCallback = callbacks.onError || null;

        roomCode = code.toUpperCase().trim();
        const peerId = ROOM_PREFIX + 'g-' + roomCode + '-' + Math.floor(Math.random() * 10000);
        const hostId = ROOM_PREFIX + roomCode;
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
                        reject(new Error('Connection timed out. Check the room code.'));
                        disconnect();
                    }
                }, 15000);

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
        get isHost() { return isHost; },
        get isConnected() { return isConnected; },
        get isPublic() { return isPublic; },
        get roomCode() { return roomCode; },
        get isActive() { return peer !== null; },
        get hasPending() { return pendingConn !== null; }
    };
})();
