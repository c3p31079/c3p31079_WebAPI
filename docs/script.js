const API_URL = "https://c3p31079-webapi.onrender.com/api/history"

fetch(API_URL)
  .then(res => {
    if (!res.ok) throw new Error("API error")
    return res.json()
  })
  .then(list => {
    const tbody = document.querySelector("#historyTable tbody")
    const status = document.getElementById("status")
    status.textContent = ""

    if (list.length === 0) {
      status.textContent = "履歴はまだありません"
      return
    }

    list.forEach(item => {
      const tr = document.createElement("tr")

      tr.innerHTML = `
        <td>${item.date}</td>
        <td>${item.length_cm.toFixed(2)}</td>
        <td>
          <a href="${item.image_url}" target="_blank">
            <img src="${item.image_url}" class="thumb">
          </a>
        </td>
      `
      tbody.appendChild(tr)
    })
  })
  .catch(err => {
    document.getElementById("status").textContent =
      "データ取得エラー"
    console.error(err)
  })
