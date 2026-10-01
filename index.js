fetch("https://go.tmlmobilidade.pt/hub/api/v1/network/stops").then(async data => {
    if(!data.ok) {
        alert("Erro ao adquirir dados das paragens.");
        return;
    }
    let stopData = await data.json();
    window.loadStops(stopData.data)
    console.log(stopData);
})

const deptToggle = document.getElementById("previousDept");

const prevDept = document.querySelector(".prevDept");

deptToggle.addEventListener("click", () => {
    const open = prevDept.classList.toggle("open");
    deptToggle.textContent = open ? "Esconder partidas anteriores" : "Ver partidas anteriores";
});