import { WebRTCManager } from './webRTCManager.js';

const pressed = { up: false, down: false, left: false, right: false };

const vectorMap = {
    up: [0, 1],
    down: [0, -1],
    left: [-1, 0],
    right: [1, 0]
};

function getMoveVector() {
    let x = 0, y = 0;
    for (const dir in pressed) {
        if (pressed[dir]) {
            x += vectorMap[dir][0];
            y += vectorMap[dir][1];
        }
    }
    return { x, y };
}

function sendMoveVector(vector) {
    if (window.webRTCManager && window.webRTCManager.isWebSocketConnected) {
        const targetId = targetPeerIdInput.value.trim();
        const msg = JSON.stringify({ type: "move", vector });
        window.webRTCManager.sendViaDataChannel(msg, targetId || null);
        console.log("送出移動向量: " + msg);
    } else {
        console.warn("WebRTC 尚未連線，無法送出移動向量:", msg);
    }
}

function startSending() {
    if (!window.sendInterval) {
        window.sendInterval = setInterval(() => {
            const vec = getMoveVector();
            sendMoveVector(vec);
        }, 16);
    }
}

function stopSendingIfNoDirection() {
    if (!Object.values(pressed).some(v => v)) {
        clearInterval(window.sendInterval);
        window.sendInterval = null;
    }
}

function setupButton(id) {
    const btn = document.getElementById(id);
    btn.addEventListener("pointerdown", () => {
        pressed[id] = true;
        startSending();
    });
    btn.addEventListener("pointerup", () => {
        pressed[id] = false;
        stopSendingIfNoDirection();
    });
    btn.addEventListener("pointerleave", () => {
        pressed[id] = false;
        stopSendingIfNoDirection();
    });
    btn.addEventListener("pointercancel", () => {
        pressed[id] = false;
        stopSendingIfNoDirection();
    });
}

["up", "down", "left", "right"].forEach(setupButton);

// === WebRTC Connect ===

const websocketUrlInput = document.getElementById("websocketUrl");
const localPeerIdInput = document.getElementById("localPeerId");
const stunServerInput = document.getElementById("stunServer");
const targetPeerIdInput = document.getElementById("targetPeerId");
const connectWsBtn = document.getElementById("connectWsBtn");
const disconnectWsBtn = document.getElementById("disconnectWsBtn");

function generatePeerId() {
    return "web-" + Math.random().toString(36).substring(2, 11);
}

localPeerIdInput.value = generatePeerId();

connectWsBtn.addEventListener("click", async () => {
    if (window.webRTCManager && window.webRTCManager.isWebSocketConnected) return;

    const wsUrl = websocketUrlInput.value.trim();
    const peerId = localPeerIdInput.value.trim();
    const stunUrl = stunServerInput.value.trim();

    if (!wsUrl || !peerId) {
        alert("請填入 WebSocket URL 和 Peer ID");
        return;
    }

    const uiConfig = {
        videoContainerId: "remoteVideosContainer",
        localVideoPlayerId: "localVideoPlayer",
    };

    window.webRTCManager = new WebRTCManager(peerId, stunUrl, uiConfig);
    const mgr = window.webRTCManager;

    mgr.onWebSocketConnection = (state) => {
        console.log("WebSocket state:", state);
        if (state === "open") {
            connectWsBtn.classList.add("hidden");
            disconnectWsBtn.classList.remove("hidden");
            //mgr.initiateOffersToAllPeers();
        } else {
            connectWsBtn.classList.remove("hidden");
            disconnectWsBtn.classList.add("hidden");
        }
    };

    mgr.onWebRTCConnection = (peerId) => {
        console.log("WebRTC connected:", peerId);
    };

    mgr.onDataChannelConnection = (peerId) => {
        console.log("Data channel ready:", peerId);
    };

    mgr.onDataChannelMessageReceived = (msg, peerId) => {
        console.log("收到來自", peerId, "的訊息:", msg);
    };

    try {
        await mgr.connect(wsUrl, true, false);
    } catch (e) {
        console.error("WebSocket 連線失敗", e);
    }
});

disconnectWsBtn.addEventListener("click", () => {
    window.webRTCManager?.closeWebSocket();
    window.webRTCManager?.closeWebRTC();
    window.webRTCManager = null;
});
