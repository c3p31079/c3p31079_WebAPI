const canvas = document.getElementById("xrCanvas");
const ctx = canvas.getContext("2d");
const measureText = document.getElementById("measureText");
const tapText = document.getElementById("tapText");
const saveBtn = document.getElementById("saveBtn");

let xrSession = null;
let xrRefSpace = null;
let hitTestSource = null;

let path3D = [];
let totalLength = 0;
let planeLocked = false;
let tapPoints3D = [];
const scale = 100; // m → cm換算

// WebXR 初期化
async function initXR() {
    if(!navigator.xr){
        alert("WebXR非対応ブラウザです");
        return;
    }

    xrSession = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test","local-floor"]
    });

    const gl = canvas.getContext("webgl",{xrCompatible:true});
    xrSession.updateRenderState({baseLayer:new XRWebGLLayer(xrSession,gl)});
    xrRefSpace = await xrSession.requestReferenceSpace("local-floor");

    const viewerSpace = await xrSession.requestReferenceSpace("viewer");
    hitTestSource = await xrSession.requestHitTestSource({space: viewerSpace});

    xrSession.requestAnimationFrame(onXRFrame);
    setupCanvasEvents();
}
initXR();

// XR フレーム
function onXRFrame(time, frame){
    const session = frame.session;
    session.requestAnimationFrame(onXRFrame);

    // Canvasリサイズ
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // 赤線描画
    ctx.strokeStyle="red";
    ctx.lineWidth=5;
    ctx.beginPath();
    path3D.forEach((p,i)=>{
        const s = p.screen;
        if(i===0) ctx.moveTo(s.x,s.y);
        else ctx.lineTo(s.x,s.y);
    });
    ctx.stroke();

    measureText.textContent = (totalLength*scale).toFixed(2) + " cm";
}

// pointerイベント
function setupCanvasEvents(){
    canvas.addEventListener("pointerdown", async e=>{
        const xrPoint = await getXRHitPoint(e.clientX,e.clientY);
        if(!xrPoint) return;

        if(!planeLocked){
            tapPoints3D.push(xrPoint);
            if(tapPoints3D.length===2){
                planeLocked = true;
                tapText.textContent="平面補正完了";
            }else{
                tapText.textContent="もう1回タップしてください";
            }
            return;
        }

        // なぞり開始
        path3D.push({pos:xrPoint, screen:{x:e.clientX, y:e.clientY}});
    });

    canvas.addEventListener("pointermove", async e=>{
        if(!planeLocked || path3D.length===0) return;
        const xrPoint = await getXRHitPoint(e.clientX,e.clientY);
        if(!xrPoint) return;

        const last = path3D[path3D.length-1].pos;
        const dx = xrPoint.x - last.x;
        const dy = xrPoint.y - last.y;
        const dz = xrPoint.z - last.z;
        totalLength += Math.sqrt(dx*dx + dy*dy + dz*dz);

        path3D.push({pos:xrPoint, screen:{x:e.clientX, y:e.clientY}});
    });
}

// --- WebXR hit-test で3D座標取得 ---
async function getXRHitPoint(clientX, clientY){
    if(!xrSession || !hitTestSource) return null;

    const frame = await new Promise(resolve=>{
        xrSession.requestAnimationFrame((t,f)=>resolve(f));
    });

    const hitTestResults = frame.getHitTestResults(hitTestSource);
    if(hitTestResults.length === 0) return null;

    const hitPose = hitTestResults[0].getPose(xrRefSpace);
    if(!hitPose) return null;

    return {
        x: hitPose.transform.position.x,
        y: hitPose.transform.position.y,
        z: hitPose.transform.position.z
    };
}

// 保存ボタン
saveBtn.addEventListener("click", ()=>{
    if(path3D.length===0) return;

    const overlayData = canvas.toDataURL("image/png");
    const length_cm = (totalLength*scale).toFixed(2);
    const time = new Date().toLocaleString();

    const history = JSON.parse(localStorage.getItem("measureHistory") || "[]");
    history.unshift({time,length_cm,overlay:overlayData});
    localStorage.setItem("measureHistory", JSON.stringify(history));

    alert("保存しました");
});
