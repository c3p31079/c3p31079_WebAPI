fetch("https://c3p31079-webapi.onrender.com/api/history")
.then(response => response.json())
.then(data => {
    const table = document.getElementById("historyTable");
    data.forEach(item => {
        const row = table.insertRow();
        row.insertCell().innerText = item.time;
        row.insertCell().innerText = item.length.toFixed(2);
        const imgCell = row.insertCell();
        const img = document.createElement("img");
        img.src = `https://c3p31079-webapi.onrender.com/${item.image}`;
        img.onclick = () => window.open(img.src, "_blank");
        imgCell.appendChild(img);
    });
})
.catch(err => alert("データ取得エラー"));
