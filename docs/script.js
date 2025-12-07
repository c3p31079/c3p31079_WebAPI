const historyList = document.getElementById("historyList");
const messageDiv = document.getElementById("message");

async function fetchHistory() {
    try {
        const res = await fetch("https://c3p31079-webapi.onrender.com/api/history");
        if (!res.ok) throw new Error("データ取得失敗");

        const data = await res.json();
        historyList.innerHTML = "";

        if (data.length === 0) {
            messageDiv.textContent = "測定履歴がありません";
            return;
        } else {
            messageDiv.textContent = "";
        }

        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";

            const img = document.createElement("img");
            img.src = "https://c3p31079-webapi.onrender.com/" + item.image.replace(/\\/g, "/");
            img.alt = "測定画像";

            const length = document.createElement("div");
            length.className = "length";
            length.textContent = `長さ: ${item.length.toFixed(2)} cm`;

            const time = document.createElement("div");
            time.className = "time";
            time.textContent = `日時: ${item.time}`;

            div.appendChild(img);
            div.appendChild(length);
            div.appendChild(time);

            historyList.appendChild(div);
        });

    } catch (err) {
        messageDiv.textContent = "データ取得エラー: " + err.message;
        console.error(err);
    }
}

fetchHistory();
