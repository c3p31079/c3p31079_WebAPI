const canvas = document.getElementById("xrCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
const measureText = document.getElementById("measureText");
const tapText = document.getElementById("tapText");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

let xrSession = null;
let xrRefSpace = null;
let hitTestSource = null;
let latestXRFrame = null;

// 計測データ
let path3D = [];     // {x,y,z}
let totalLength = 0; // メートル
let planeLocked = false;
let tapPoints3D = []; // 補正用最初の2点
const M_TO_CM = 100;

// ノイズ低減パラメータ（調整可）
const HIT_AVG_WINDOW = 4;    // hit-test の短時間平均窓
const MIN_POINT_DIST = 0.006; // m：これ未満の移動は無視（ポイント間引き）
const SMOOTH_ALPHA = 0.6;    // 新しいhitをどれだけ反映するか（0〜1）: 大きいほど反応速い

// 内部バッファ
const recentHits = []; // 平滑化用バッファ

// 行列ユーティリティ
function multiplyMat4Vec4(mat, vec){
  const r = [0,0,0,0];
  for(let i=0;i<4;i++){
    r[i] = mat[i]*vec[0] + mat[i+4]*vec[1] + mat[i+8]*vec[2] + mat[i+12]*vec[3];
  }
  return r;
}

function inverseMat4(m){
  // 省略せずに完全版を入れておく（前回提示の関数を流用）
  const inv = new Float32Array(16);
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

  inv[0]  = a11 * a22 * a33 - a11 * a23 * a32 - a21 * a12 * a33 + a21 * a13 * a32 + a31 * a12 * a23 - a31 * a13 * a22;
  inv[4]  = -a10 * a22 * a33 + a10 * a23 * a32 + a20 * a12 * a33 - a20 * a13 * a32 - a30 * a12 * a23 + a30 * a13 * a22;
  inv[8]  = a10 * a21 * a33 - a10 * a23 * a31 - a20 * a11 * a33 + a20 * a13 * a31 + a30 * a11 * a23 - a30 * a13 * a21;
  inv[12] = -a10 * a21 * a32 + a10 * a22 * a31 + a20 * a11 * a32 - a20 * a12 * a31 - a30 * a11 * a22 + a30 * a12 * a21;

  inv[1]  = -a01 * a22 * a33 + a01 * a23 * a32 + a21 * a02 * a33 - a21 * a03 * a32 - a31 * a02 * a23 + a31 * a03 * a22;
  inv[5]  = a00 * a22 * a33 - a00 * a23 * a32 - a20 * a02 * a33 + a20 * a03 * a32 + a30 * a02 * a23 - a30 * a03 * a22;
  inv[9]  = -a00 * a21 * a33 + a00 * a23 * a31 + a20 * a01 * a33 - a20 * a03 * a31 - a30 * a01 * a23 + a30 * a03 * a21;
  inv[13] = a00 * a21 * a32 - a00 * a22 * a31 - a20 * a01 * a32 + a20 * a02 * a31 + a30 * a01 * a22 - a30 * a02 * a21;

  inv[2]  = a01 * a12 * a33 - a01 * a13 * a32 - a11 * a02 * a33 + a11 * a03 * a32 + a31 * a02 * a13 - a31 * a03 * a12;
  inv[6]  = -a00 * a12 * a33 + a00 * a13 * a32 + a10 * a02 * a33 - a10 * a03 * a32 - a30 * a02 * a13 + a30 * a03 * a12;
  inv[10] = a00 * a11 * a33 - a00 * a13 * a31 - a10 * a01 * a33 + a10 * a03 * a31 + a30 * a01 * a13 - a30 * a03 * a11;
  inv[14] = -a00 * a11 * a32 + a00 * a12 * a31 + a10 * a01 * a32 - a10 * a02 * a31 - a30 * a01 * a12 + a30 * a02 * a11;

  inv[3]  = -a01 * a12 * a23 + a01 * a13 * a22 + a11 * a02 * a23 - a11 * a03 * a22 - a21 * a02 * a13 + a21 * a03 * a12;
  inv[7]  = a00 * a12 * a23 - a00 * a13 * a22 - a10 * a02 * a23 + a10 * a03 * a22 + a20 * a02 * a13 - a20 * a03 * a12;
  inv[11] = -a00 * a11 * a23 + a00 * a13 * a21 + a10 * a01 * a23 - a10 * a03 * a21 - a20 * a01 * a13 + a20 * a03 * a11;
  inv[15] = a00 * a11 * a22 - a00 * a12 * a21 - a10 * a01 * a22 + a10 * a02 * a21 + a20 * a01 * a12 - a20 * a02 * a11;

  let det = a00*inv[0] + a01*inv[4] + a02*inv[8] + a03*inv[12];
  if(det === 0) return null;
  det = 1.0 / det;
  for(let i=0;i<16;i++) inv[i] = inv[i] * det;
  return inv;
}

// ワールド座標 -> スクリーン座標
function worldToScreen(pos, frame){
  if(!frame || !frame.views || frame.views.length===0) return null;
  const view = frame.views[0];
  const proj = view.projectionMatrix; // Float32Array(16)
  const transform = view.transform.matrix; // Float32Array(16)

  const viewMat = inverseMat4(transform);
  if(!viewMat) return null;

  let vec = [pos.x, pos.y, pos.z, 1.0];
  vec = multiplyMat4Vec4(viewMat, vec);
  vec = multiplyMat4Vec4(proj, vec);

  if(vec[3] === 0) return null;
  const ndcX = vec[0] / vec[3];
  const ndcY = vec[1] / vec[3];

  const cx = (ndcX * 0.5 + 0.5) * canvas.width;
  const cy = (-ndcY * 0.5 + 0.5) * canvas.height;
  return { x: cx, y: cy };
}

// hit-test を短時間平均してノイズを低減して返却
function averageHits(newPoint){
  recentHits.push(newPoint);
  if(recentHits.length > HIT_AVG_WINDOW) recentHits.shift();
  // 平均化
  let sx=0, sy=0, sz=0;
  for(const p of recentHits){ sx += p.x; sy += p.y; sz += p.z; }
  const n = recentHits.length;
  // 線形補間で平滑（前回値とのアルファブレンド）
  const avg = { x: sx/n, y: sy/n, z: sz/n };
  return avg;
}

// performHitTest: client座標 -> ワールド座標（hit-test 結果を平均して返す）
// 実装上の注意：各ブラウザの hit-test 実装差があるため、まず results[0] を取る
// さらに短時間平均をかけて安定させる戦略を取る。
async function performHitTest(clientX, clientY){
  if(!latestXRFrame || !hitTestSource) return null;

  // getHitTestResults は viewer-based hit source から全ヒットを返す
  const results = latestXRFrame.getHitTestResults(hitTestSource);
  if(!results || results.length === 0) return null;

  // ここでは最初の結果を使う（改善：スクリーン方向や距離で選ぶ）
  const hit = results[0];
  const pose = hit.getPose(xrRefSpace);
  if(!pose) return null;
  const p = pose.transform.position;
  const raw = { x: p.x, y: p.y, z: p.z };

  // 短時間平均で安定させる（バッファ内の平均）
  const smooth = averageHits(raw);

  // 補正（指数移動平均でさらに平滑化）
  if(recentHits._last){
    smooth.x = recentHits._last.x * (1 - SMOOTH_ALPHA) + smooth.x * SMOOTH_ALPHA;
    smooth.y = recentHits._last.y * (1 - SMOOTH_ALPHA) + smooth.y * SMOOTH_ALPHA;
    smooth.z = recentHits._last.z * (1 - SMOOTH_ALPHA) + smooth.z * SMOOTH_ALPHA;
  }
  recentHits._last = smooth;
  return smooth;
}

// 平面推定と点の平面投影
// 「2点タップ」から平面法線を近似して、以降の点はその平面に射影する
function computePlaneFromTwoPoints(p0, p1, cameraPos){
  // p0, p1: ワールド座標の2点、cameraPos: カメラ位置（未使用で代替）
  // ベクトル between
  const v = { x: p1.x - p0.x, y: p1.y - p0.y, z: p1.z - p0.z };
  // カメラ方向ベクトル（カメラ->p0）
  const camVec = { x: p0.x - (cameraPos?.x || 0), y: p0.y - (cameraPos?.y || 0), z: p0.z - (cameraPos?.z || 0) };
  // 法線 = camVec × v （単純な近似）
  const n = {
    x: camVec.y * v.z - camVec.z * v.y,
    y: camVec.z * v.x - camVec.x * v.z,
    z: camVec.x * v.y - camVec.y * v.x
  };
  // 正規化
  const len = Math.hypot(n.x, n.y, n.z) || 1e-6;
  n.x/=len; n.y/=len; n.z/=len;
  return { point: p0, normal: n };
}

// 点 p を平面 (plane.point, plane.normal) に射影
function projectPointToPlane(p, plane){
  const vx = p.x - plane.point.x;
  const vy = p.y - plane.point.y;
  const vz = p.z - plane.point.z;
  const d = vx*plane.normal.x + vy*plane.normal.y + vz*plane.normal.z;
  return {
    x: p.x - d*plane.normal.x,
    y: p.y - d*plane.normal.y,
    z: p.z - d*plane.normal.z
  };
}

// WebXR 初期化と hit-test source 作成
async function initXR(){
  if(!navigator.xr){
    alert("WebXR 非対応のブラウザです（Chrome on Android 推奨）");
    return;
  }
  try{
    xrSession = await navigator.xr.requestSession("immersive-ar", { requiredFeatures: ["hit-test","local-floor"] });

    // GL レイヤ
    const gl = canvas.getContext("webgl", { xrCompatible: true });
    xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(xrSession, gl) });

    xrRefSpace = await xrSession.requestReferenceSpace("local-floor");
    const viewerSpace = await xrSession.requestReferenceSpace("viewer");
    hitTestSource = await xrSession.requestHitTestSource({ space: viewerSpace });

    xrSession.requestAnimationFrame(onXRFrame);
    setupPointerEvents();
  }catch(err){
    console.error("XR init error:", err);
    alert("WebXR 初期化中にエラーが発生しました: " + err.message);
  }
}

// フレームコールバック（描画）
function onXRFrame(time, frame){
  latestXRFrame = frame;
  xrSession.requestAnimationFrame(onXRFrame);

  // 高DPI対応
  canvas.width = Math.floor(canvas.clientWidth * window.devicePixelRatio);
  canvas.height = Math.floor(canvas.clientHeight * window.devicePixelRatio);
  ctx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);

  // 描画（オーバーレイの赤線）
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for(let i=0;i<path3D.length;i++){
    const p = path3D[i];
    const s = worldToScreen(p, frame);
    if(!s) continue;
    if(i===0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  }
  ctx.stroke();

  measureText.textContent = (totalLength * M_TO_CM).toFixed(2) + " cm";
}

// pointer イベント（タップで平面補正、なぞりで点取得）
function setupPointerEvents(){
  let pressing = false;

  canvas.addEventListener("pointerdown", async (ev) => {
    if(!latestXRFrame || !hitTestSource) return;
    const pt = await performHitTest(ev.clientX, ev.clientY);
    if(!pt) return;

    // 平面補正（最初の2タップ）
    if(!planeLocked){
      tapPoints3D.push(pt);
      if(tapPoints3D.length === 2){
        planeLocked = true;
        // 簡易的にカメラ位置は view.transform.position から推定
        // cameraPos を取得できるなら渡す（今回は未取得なので undefined）
        plane = computePlaneFromTwoPoints(tapPoints3D[0], tapPoints3D[1], undefined);
        tapText.textContent = "平面補正完了";
      }else{
        tapText.textContent = "もう一回タップしてください";
      }
      return;
    }

    // なぞり開始（最初の点追加）
    pressing = true;
    const projected = plane ? projectPointToPlane(pt, plane) : pt;
    // 間引き：最初はそのまま入れる
    path3D.push(projected);
  });

  canvas.addEventListener("pointermove", async (ev) => {
    if(!pressing || !planeLocked) return;
    const pt = await performHitTest(ev.clientX, ev.clientY);
    if(!pt) return;
    const projected = plane ? projectPointToPlane(pt, plane) : pt;

    // 閾値で間引き
    const last = path3D[path3D.length - 1];
    const dx = projected.x - last.x;
    const dy = projected.y - last.y;
    const dz = projected.z - last.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if(dist < MIN_POINT_DIST) return; // 小さな揺れは無視

    // 距離積算（3D）
    totalLength += dist;
    path3D.push(projected);
  });

  canvas.addEventListener("pointerup", ()=>{ pressing = false; });
  canvas.addEventListener("pointercancel", ()=>{ pressing = false; });

  // 保存
  saveBtn.addEventListener("click", ()=>{
    if(path3D.length === 0) return;
    const overlayData = canvas.toDataURL("image/png");
    const length_cm = (totalLength * M_TO_CM).toFixed(2);
    const time = new Date().toLocaleString();
    const hist = JSON.parse(localStorage.getItem("measureHistory") || "[]");
    hist.unshift({ time, length_cm, overlay: overlayData });
    localStorage.setItem("measureHistory", JSON.stringify(hist));
    alert("保存しました（localStorage）");
  });

  // リセット
  resetBtn.addEventListener("click", ()=>{
    path3D = [];
    totalLength = 0;
    planeLocked = false;
    tapPoints3D = [];
    recentHits.length = 0;
    recentHits._last = null;
    tapText.textContent = "最初に2回タップして平面補正してください";
  });
}

// 実際の hit-test 実行（最新フレームの hitTestResults から得る）
async function performHitTest(clientX, clientY){
  if(!latestXRFrame || !hitTestSource) return null;

  // ここでは単純に最新の hitTestResults から最初のものを選ぶ戦略
  const results = latestXRFrame.getHitTestResults(hitTestSource);
  if(!results || results.length === 0) return null;

  // 可能なら画面座標に最も合致する結果を選ぶのが理想（高度）
  const hit = results[0];
  const pose = hit.getPose(xrRefSpace);
  if(!pose) return null;
  const p = pose.transform.position;
  return { x: p.x, y: p.y, z: p.z };
}

// 初期化実行
initXR().catch(err=>{
  console.error("WebXR 初期化エラー:", err);
  alert("WebXR 初期化に失敗しました: " + (err && err.message ? err.message : err));
});
