// Render の Flask API URL
const API_BASE = "https://c3p31079-webapi.onrender.com";

async function fetchHistory() {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "読み込み中…";

  try {
    const response = await fetch(`${API_BASE}/api/history`);
    if (!response.ok) throw new Error("レスポンスエラー");
    const data = await response.json();

    const tbody = document.getElementById("historyTable");
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='3'>履歴なし</td></tr>";
    } else {
      data.forEach(item => {
        const tr = document.createElement("tr");

        // 日付
        const dateTd = document.createElement("td");
        const dt = new Date(item.time);
        dateTd.textContent = dt.toLocaleString();
        tr.appendChild(dateTd);

        // 長さ
        const lenTd = document.createElement("td");
        lenTd.textContent = item.length.toFixed(2);
        tr.appendChild(lenTd);

        // 画像
        const imgTd = document.createElement("td");
        const img = document.createElement("img");
        img.src = `${API_BASE}/uploads/${item.image.split("/").pop()}`;
        img.alt = "線なし画像";
        img.onclick = () => window.open(img.src, "_blank");
        imgTd.appendChild(img);
        tr.appendChild(imgTd);

        tbody.appendChild(tr);
      });
    }

    statusDiv.textContent = "";
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "データ取得エラー";
    statusDiv.style.color = "red";
  }
}

// ページ読み込み時に履歴を取得
window.addEventListener("DOMContentLoaded", fetchHistory);
