const video = document.getElementById("video");
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const measureText = document.getElementById("measureText");
const confirmBtn = document.getElementById("confirmBtn");

let drawing = false;
let path = [];
let totalLength = 0;

// カメラ起動
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
.then(stream => video.srcObject = stream)
.catch(err => alert("カメラ取得失敗: " + err));

function resizeCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}
video.addEventListener("loadedmetadata", resizeCanvas);

// 線描画
canvas.addEventListener("pointerdown", e => {
    drawing = true;
    path = [{x: e.offsetX, y: e.offsetY}];
    totalLength = 0;
    draw();
});

canvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    const last = path[path.length - 1];
    const newPoint = {x: e.offsetX, y: e.offsetY};
    const dx = newPoint.x - last.x;
    const dy = newPoint.y - last.y;
    totalLength += Math.sqrt(dx*dx + dy*dy);
    path.push(newPoint);
    draw();
});

canvas.addEventListener("pointerup", e => {
    drawing = false;
    measureText.textContent = (totalLength / 10).toFixed(2) + " cm"; // 仮スケール
});

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i=0; i<path.length; i++){
        const p = path[i];
        if (i==0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
}

// 確定ボタン
confirmBtn.addEventListener("click", async ()=>{
    if (path.length==0) return;

    // Canvasを画像化
    const overlayBlob = await new Promise(r => canvas.toBlob(r, "image/png"));

    // 動画フレームキャプチャ
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const cctx = captureCanvas.getContext("2d");
    cctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    const originalBlob = await new Promise(r => captureCanvas.toBlob(r, "image/png"));

    // フォーム作成
    const formData = new FormData();
    formData.append("image", originalBlob, "original.png");
    formData.append("overlay", overlayBlob, "overlay.png");
    formData.append("length_cm", (totalLength/10).toFixed(2)); // 仮スケール

    const res = await fetch("http://localhost:5001/api/upload", { method:"POST", body:formData });
    const data = await res.json();
    console.log("アップロード結果:", data);

    // 次の描画のためクリア
    path = [];
    totalLength = 0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    measureText.textContent = "0.0 cm";
});
