// history_app.js
const tbody = document.querySelector("#historyTable tbody");
const clearAllBtn = document.getElementById("clearAll");

function loadHistory(){
  const items = JSON.parse(localStorage.getItem("measureHistory") || "[]");
  tbody.innerHTML = "";
  items.forEach((it, idx)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.time}</td>
      <td style="min-width:120px">${it.length_cm}</td>
      <td><img src="${it.overlay}" alt="overlay" onclick="window.open('${it.overlay}')"></td>
      <td><button data-idx="${idx}" class="button del">削除</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".del").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const idx = Number(e.currentTarget.dataset.idx);
      const arr = JSON.parse(localStorage.getItem("measureHistory") || "[]");
      arr.splice(idx,1);
      localStorage.setItem("measureHistory", JSON.stringify(arr));
      loadHistory();
    });
  });
}

clearAllBtn?.addEventListener("click", ()=>{
  if(!confirm("履歴を全て削除しますか？")) return;
  localStorage.removeItem("measureHistory");
  loadHistory();
});

loadHistory();
