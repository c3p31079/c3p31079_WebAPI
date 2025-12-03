const video = document.getElementById("video");
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const measureText = document.getElementById("measureText");
const tapText = document.getElementById("tapText");
const resetBtn = document.getElementById("resetBtn");
const confirmBtn = document.getElementById("confirmBtn");

let path = [];
let drawing = false;
let totalLength = 0;
let scale = 1; // px -> cm
let tapPoints = [];
let planeLocked = false;

// カメラ起動
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
.then(stream => video.srcObject = stream)
.catch(err => alert("カメラ取得失敗: " + err));

function resizeCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}
video.addEventListener("loadedmetadata", resizeCanvas);

// --- タップで平面補正 ---
canvas.addEventListener("pointerdown", e => {
    if (!planeLocked) {
        tapPoints.push({x:e.offsetX, y:e.offsetY});
        if (tapPoints.length == 2) {
            const dx = tapPoints[1].x - tapPoints[0].x;
            const dy = tapPoints[1].y - tapPoints[0].y;
            const pixelDistance = Math.sqrt(dx*dx + dy*dy);
            const knownLength = 10; // cm（任意の基準長）
            scale = knownLength / pixelDistance;
            planeLocked = true;
            tapText.textContent = "平面補正完了";
        } else {
            tapText.textContent = "もう1回タップしてください";
        }
        return;
    }

    // 描画開始
    drawing = true;
    path = [{x:e.offsetX, y:e.offsetY}];
    totalLength = 0;
    draw();
});

canvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    const last = path[path.length-1];
    const newPoint = {x:e.offsetX, y:e.offsetY};
    const dx = newPoint.x - last.x;
    const dy = newPoint.y - last.y;
    totalLength += Math.sqrt(dx*dx + dy*dy);
    path.push(newPoint);
    draw();
});

canvas.addEventListener("pointerup", e => {
    drawing = false;
    measureText.textContent = (totalLength*scale).toFixed(2) + " cm";
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

// やり直しボタン
resetBtn.addEventListener("click", ()=>{
    path = [];
    totalLength = 0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    measureText.textContent = "0.0 cm";
    tapPoints = [];
    planeLocked = false;
    tapText.textContent = "2回タップして平面補正";
});

// 保存ボタン
confirmBtn.addEventListener("click", async ()=>{
    if (path.length==0) return;

    // オーバーレイ画像
    const overlayData = canvas.toDataURL("image/png");

    // 元画像キャプチャ
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const cctx = captureCanvas.getContext("2d");
    cctx.drawImage(video,0,0,captureCanvas.width,captureCanvas.height);
    const originalData = captureCanvas.toDataURL("image/png");

    const length_cm = (totalLength*scale).toFixed(2);
    const time = new Date().toLocaleString();

    // localStorage へ保存
    const history = JSON.parse(localStorage.getItem("measureHistory") || "[]");
    history.unshift({
        time,
        length_cm,
        image: originalData,
        overlay: overlayData
    });
    localStorage.setItem("measureHistory", JSON.stringify(history));

    // トップページに戻る
    window.location.href = "index.html";
});
