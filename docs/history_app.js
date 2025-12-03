const tableBody = document.querySelector("#historyTable tbody");

function loadHistory(){
    const history = JSON.parse(localStorage.getItem("measureHistory") || "[]");
    tableBody.innerHTML = "";

    history.forEach((item, idx)=>{
        const tr = document.createElement("tr");

        const tdTime = document.createElement("td");
        tdTime.textContent = item.time;
        tr.appendChild(tdTime);

        const tdLength = document.createElement("td");
        tdLength.textContent = item.length_cm + " cm";
        tr.appendChild(tdLength);

        const tdImg = document.createElement("td");
        const img = document.createElement("img");
        img.src = item.overlay;
        img.style.width = "100px";
        img.style.cursor = "pointer";
        img.onclick = ()=> window.open(item.overlay);
        tdImg.appendChild(img);
        tr.appendChild(tdImg);

        const tdDel = document.createElement("td");
        const delBtn = document.createElement("button");
        delBtn.textContent = "削除";
        delBtn.onclick = ()=>{
            history.splice(idx,1);
            localStorage.setItem("measureHistory",JSON.stringify(history));
            loadHistory();
        };
        tdDel.appendChild(delBtn);
        tr.appendChild(tdDel);

        tableBody.appendChild(tr);
    });
}

loadHistory();
