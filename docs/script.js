const API_URL = "https://c3p31079-webapi.onrender.com";

async function fetchHistory() {
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = "読み込み中...";

    try {
        const res = await fetch(`${API_URL}/api/history`);
        if (!res.ok) throw new Error("通信エラー");
        const data = await res.json();

        const tbody = document.querySelector("#historyTable tbody");
        tbody.innerHTML = "";

        data.forEach(item => {
            const tr = document.createElement("tr");

            // 日付
            const tdTime = document.createElement("td");
            tdTime.textContent = item.time;
            tr.appendChild(tdTime);

            // 長さ
            const tdLength = document.createElement("td");
            tdLength.textContent = item.length;
            tr.appendChild(tdLength);

            // 画像
            const tdImg = document.createElement("td");
            const img = document.createElement("img");
            img.src = `${API_URL}${item.image_url}`;
            img.alt = "測定画像";
            img.onclick = () => window.open(img.src, "_blank");
            tdImg.appendChild(img);
            tr.appendChild(tdImg);

            tbody.appendChild(tr);
        });

        statusDiv.textContent = `全 ${data.length} 件`;
    } catch (e) {
        console.error(e);
        statusDiv.textContent = `データ取得エラー: ${e.message}`;
    }
}

// 初回読み込み
fetchHistory();
