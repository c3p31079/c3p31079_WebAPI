fetch("https://c3p31079-webapi.onrender.com/history")
.then(res => res.json())
.then(data => {
    const table = document.getElementById("historyTable");
    data.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${item.time}</td><td>${item.length_cm.toFixed(2)}</td><td><img src="${item.image}" onclick="window.open('${item.image}','_blank')"/></td>`;
        table.appendChild(tr);
    });
})
.catch(err => alert("データ取得エラー: " + err));
