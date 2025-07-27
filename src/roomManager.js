window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    const unityPeerId = params.get("unityPeerId");

    if (roomId && unityPeerId) {
        console.log("Room ID:", roomId);
        console.log("Unity Peer ID:", unityPeerId);
        // 可以呼叫 webRTCManager.init(unityPeerId) 或其他初始化流程
        document.getElementById("roomInfo").textContent = `你正在加入房間 ${roomId}`;
    } else {
        console.warn("URL 缺少必要參數");
    }
});