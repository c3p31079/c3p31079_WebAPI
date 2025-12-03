(async function() {

    const res = await fetch("https://YOUR_EC2_DOMAIN/api/history");
    const history = await res.json();

    const list = document.getElementById("list");

    history.forEach(item => {
        const div = document.createElement("div");
        div.style.margin = "20px";

        div.innerHTML = `
            <p>${item.time}</p>
            <img src="${item.image_url}" width="200">
            <img src="${item.overlay_url}" width="200">
            <p><b>${item.crack_cm.toFixed(2)} cm</b></p>
        `;

        list.appendChild(div);
    });

})();
