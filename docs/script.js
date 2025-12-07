const historyBody = document.getElementById("history-body");

async function loadHistory() {
    try {
        const res = await fetch("https://c3p31079-webapi.onrender.com/history");
        const data = await res.json();
        historyBody.innerHTML = "";
        data.forEach(item => {
            const tr = document.createElement("tr");
            const dateTd = document.createElement("td");
            dateTd.textContent = item.time;
            const lengthTd = document.createElement("td");
            lengthTd.textContent = item.length_cm;
            const imgTd = document.createElement("td");
            const img = document.createElement("img");
            img.src = `https://c3p31079-webapi.onrender.com/${item.image}`;
            img.onclick = () => window.open(img.src, "_blank");
            imgTd.appendChild(img);

            tr.appendChild(dateTd);
            tr.appendChild(lengthTd);
            tr.appendChild(imgTd);
            historyBody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        historyBody.innerHTML = "<tr><td colspan='3'>データ取得エラー</td></tr>";
    }
}

loadHistory();
