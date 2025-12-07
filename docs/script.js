// 計測履歴をWeb APIから取得して表示
const API_BASE = "https://c3p31079-webapi.onrender.com";

// ページ読み込み時に実行
window.addEventListener("DOMContentLoaded", () => {
  loadHistory();
});

// 履歴取得
function loadHistory() {
  fetch(`${API_BASE}/api/history`)
    .then(response => {
      if (!response.ok) {
        throw new Error("履歴取得に失敗しました");
      }
      return response.json();
    })
    .then(data => {
      renderTable(data);
    })
    .catch(error => {
      console.error(error);
      alert("データ取得エラー");
    });
}

// 表を描画
function renderTable(items) {
  const table = document.getElementById("history-table");

  // 既存の行を削除（再読み込み対応）
  table.innerHTML = `
    <tr>
      <th>日時</th>
      <th>長さ (cm)</th>
      <th>画像</th>
    </tr>
  `;

  // 新しい順に表示
  items
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .forEach(item => {
      const row = table.insertRow();

      // 日時
      const timeCell = row.insertCell();
      timeCell.textContent = item.time;

      // 長さ
      const lengthCell = row.insertCell();
      lengthCell.textContent = Number(item.length_cm).toFixed(2);

      // 画像
      const imageCell = row.insertCell();
      const img = document.createElement("img");

      // Render側で static として配信している想定
      img.src = `${API_BASE}/${item.image}`;
      img.alt = "計測画像";
      img.className = "thumbnail";

      // クリックで拡大
      img.addEventListener("click", () => {
        openImageViewer(img.src);
      });

      imageCell.appendChild(img);
    });
}

// 画像拡大ビュー
function openImageViewer(src) {
  const overlay = document.createElement("div");
  overlay.className = "image-overlay";

  const img = document.createElement("img");
  img.src = src;
  img.className = "image-full";

  overlay.appendChild(img);

  overlay.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  document.body.appendChild(overlay);
}
