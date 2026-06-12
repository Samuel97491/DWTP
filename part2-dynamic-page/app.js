const elements = {
    input: document.getElementById('itemInput'),
    list: document.getElementById('myList'),
    status: document.getElementById('status'),
    svg: document.getElementById('svgContainer')
};

document.getElementById('btnBlue').onclick = () => {
    document.body.style.backgroundColor = "#dbeafe";
    document.querySelectorAll('button').forEach(b => b.style.color = "#1e40af");
};

document.getElementById('btnWhite').onclick = () => {
    document.body.style.backgroundColor = "#ffffff";
    document.querySelectorAll('button').forEach(b => b.style.color = "initial");
};

document.getElementById('btnAdd').onclick = () => {
    const val = elements.input.value.trim();
    if (!val) return;
    const li = document.createElement('li');
    li.textContent = val;
    li.onclick = function() { elements.input.value = this.textContent; };
    elements.list.appendChild(li);
    elements.input.value = "";
};

async function loadMap() {
    const res = await fetch("lyon_districts.svg");
    elements.svg.innerHTML = await res.text();
    elements.svg.querySelectorAll('path[id^="Lyon"]').forEach(path => {
        path.onclick = () => elements.status.textContent = `Region selected: ${path.id}`;
    });
}

loadMap();
