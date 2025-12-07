// BACKEND_BASE を自分のサーバに変更
const BACKEND_BASE = "https://YOUR_BACKEND_DOMAIN_OR_IP:5000";

async function load() {
  const r = await fetch(BACKEND_BASE + "/api/history");
  const data = await r.json();
  const list = document.getElementById("list");
  list.innerHTML = "";
  data.forEach(item => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <div><strong>${new Date(item.time * 1000).toLocaleString()}</strong></div>
      <div>長さ: ${item.length_cm ?? "N/A"} cm</div>
      <div>
        <a href="${BACKEND_BASE}${item.raw_url}" target="_blank">
          <img src="${BACKEND_BASE}${item.overlay_url}" alt="overlay"/>
        </a>
      </div>
    `;
    list.appendChild(el);
  });
}

load().catch(e => {
  document.getElementById("list").innerText = "履歴取得エラー: " + e.message;
});
