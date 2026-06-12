class VeloApp {
    constructor() {
        this.apiBase = '/api';
        this.state = {
            communeStats: {},
            currentFilter: ''
        };

        this.elements = {
            stationsTable: document.querySelector("#stationsTable tbody"),
            communeSelect: document.getElementById("communeSelect"),
            countHint: document.getElementById("countHint"),
            map: document.getElementById("map"),
            hoverStats: document.getElementById("hover-stats"),
            overlay: document.getElementById("district-detail-overlay"),
            districtTitle: document.getElementById("districtTitle"),
            districtStations: document.querySelector("#districtStations tbody"),
            enrichedTable: document.querySelector("#enrichedTable tbody"),
            closeBtn: document.getElementById("close-detail")
        };

        this.init();
    }

    async init() {
        try {
            await Promise.all([
                this.initFilters(),
                this.initMap(),
                this.loadEnrichedData()
            ]);
            this.bindEvents();
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    bindEvents() {
        this.elements.communeSelect.addEventListener('change', (e) => this.loadStations(e.target.value));
        this.elements.closeBtn.addEventListener('click', () => this.toggleOverlay(false));
        document.addEventListener('keydown', (e) => e.key === 'Escape' && this.toggleOverlay(false));
        this.elements.overlay.addEventListener('click', (e) => e.target === this.elements.overlay && this.toggleOverlay(false));
    }

    async fetchAPI(endpoint) {
        const response = await fetch(`${this.apiBase}${endpoint}`);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }

    async loadStations(commune = "") {
        const data = await this.fetchAPI(`/stations/names${commune ? `?commune=${encodeURIComponent(commune)}` : ''}`);
        this.elements.stationsTable.innerHTML = data.map(s => `
            <tr>
                <td style="font-weight: 600;">${s.name}</td>
                <td style="color: var(--text-muted);">${s.commune}</td>
            </tr>
        `).join('');
        this.elements.countHint.textContent = `${data.length} stations active`;
    }

    async initFilters() {
        const communes = await this.fetchAPI('/communes');
        communes.forEach(c => {
            const opt = new Option(c, c);
            this.elements.communeSelect.add(opt);
        });
        await this.loadStations();
    }

    async initMap() {
        const [stats, svgText] = await Promise.all([
            this.fetchAPI('/communes/stats'),
            fetch("lyon_districts.svg").then(r => r.text())
        ]);

        stats.forEach(s => this.state.communeStats[s.commune] = s);
        this.elements.map.innerHTML = svgText;

        const paths = this.elements.map.querySelectorAll('path[id^="Lyon"]');
        paths.forEach(path => {
            const commune = this.mapIdToCommune(path.id);
            path.addEventListener('mouseenter', () => this.updateHoverInfo(commune));
            path.addEventListener('mouseleave', () => this.resetHoverInfo());
            path.addEventListener('click', () => this.showDistrictDetails(commune));
        });
    }

    mapIdToCommune(id) {
        const n = id.replace("Lyon ", "").trim();
        return n === "1" ? "Lyon 1er Arrondissement" : `Lyon ${n}e Arrondissement`;
    }

    updateHoverInfo(commune) {
        const s = this.state.communeStats[commune];
        if (!s) return;

        this.elements.hoverStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Dist.</span>
                    <span class="stat-val">${commune.split(' ')[1]}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Nodes</span>
                    <span class="stat-val">${s.stationCount}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Avail.</span>
                    <span class="stat-val">${s.avgAvailableBikes}</span>
                </div>
            </div>
        `;
    }

    resetHoverInfo() {
        this.elements.hoverStats.innerHTML = `<p class="placeholder" style="text-align: center; color: var(--text-muted);">Hover a district to explore</p>`;
    }

    async showDistrictDetails(commune) {
        const stations = await this.fetchAPI(`/stations?commune=${encodeURIComponent(commune)}`);
        this.elements.districtTitle.textContent = commune;
        this.elements.districtStations.innerHTML = stations.map(s => `
            <tr>
                <td style="font-weight: 600;">${s.name}</td>
                <td style="color: var(--text-muted); font-size: 0.75rem;">${s.address || 'N/A'}</td>
                <td style="text-align: center;"><strong>${s.available_bikes}</strong></td>
                <td><span class="badge ${s.status.toLowerCase()}">${s.status}</span></td>
            </tr>
        `).join('');
        this.toggleOverlay(true);
    }

    toggleOverlay(show) {
        this.elements.overlay.classList.toggle('active', show);
    }

    async loadEnrichedData() {
        const data = await this.fetchAPI('/communes/enriched');
        this.elements.enrichedTable.innerHTML = data.map(r => `
            <tr>
                <td style="font-weight: 600;">${r.commune}</td>
                <td>${r.stationCount}</td>
                <td>${r.population?.toLocaleString() || '—'}</td>
                <td>${r.area_km2 || '—'}</td>
                <td><strong style="color: var(--primary);">${r.stationsPer10kInhabitants || '—'}</strong></td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => new VeloApp());
