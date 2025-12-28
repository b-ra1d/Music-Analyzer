const BASE_URL = 'https://api.deezer.com/search?q=';

async function searchTracks(query) {
    try {
        const response = await fetch(`https://corsproxy.io/?${BASE_URL}${query}`);
        const data = await response.json();
        incrementSearchCount();
        return data.data;
    } catch (error) {
        console.error('Ошибка API', error);
        return [];
    }
}

async function getTrackById(id) {
    try {
        const res = await fetch(`https://corsproxy.io/?https://api.deezer.com/track/${id}`);
        return await res.json();
    } catch (err) {
        console.error(err);
        return null;
    }
}

const KEY = 'favorites';
function getFavorites() { return JSON.parse(localStorage.getItem(KEY)) || []; }
function saveFavorites(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
function toggleFavorite(track) {
    let favorites = getFavorites();
    const exists = favorites.find(t => t.id === track.id);
    if (exists) favorites = favorites.filter(t => t.id !== track.id);
    else favorites.push(track);
    saveFavorites(favorites);
}

function incrementSearchCount() {
    let count = parseInt(localStorage.getItem('search-count')) || 0;
    count++;
    localStorage.setItem('search-count', count);
}

function renderTracks(container, tracks) {
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    grid.style.gap = '15px';

    tracks.forEach(track => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img src="${track.album.cover}" style="width:100%; border-radius:10px; margin-bottom:10px;">
            <p><strong>${track.title}</strong></p>
            <p>${track.artist.name}</p>
            <audio controls src="${track.preview}"></audio>
            <div style="display:flex; gap:10px; margin-top:5px;">
                <button onclick='toggleFavorite(${JSON.stringify(track).replace(/'/g,"\\'")})'>❤</button>
                <a style="color:#38bdf8; align-self:center;" href="track.html?id=${track.id}">Детали</a>
            </div>
        `;
        grid.appendChild(div);
    });
    container.appendChild(grid);
}

function renderFavorites(container) {
    const favs = getFavorites();
    container.innerHTML = '';
    if (!favs.length) { container.innerHTML = '<p>Нет избранного</p>'; return; }
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    grid.style.gap = '15px';
    favs.forEach(track => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <img src="${track.album.cover}" style="width:100%; border-radius:10px; margin-bottom:10px;">
            <p><strong>${track.title}</strong></p>
            <p>${track.artist.name}</p>
            <audio controls src="${track.preview}"></audio>
            <div style="display:flex; gap:10px; margin-top:5px;">
                <button onclick='toggleFavorite(${JSON.stringify(track).replace(/'/g,"\\'")}); renderFavorites(document.getElementById("fav-list"))'>Удалить</button>
                <a style="color:#38bdf8; align-self:center;" href="track.html?id=${track.id}">Детали</a>
            </div>
        `;
        grid.appendChild(div);
    });
    container.appendChild(grid);
}

if (document.getElementById('search')) {
    const input = document.getElementById('search');
    const list = document.getElementById('list');
    input.addEventListener('input', async () => {
        if (input.value.length < 3) return;
        list.innerHTML = 'Загрузка...';
        const tracks = await searchTracks(input.value);
        renderTracks(list, tracks);
    });
}

if (document.getElementById('track-detail')) {
    const container = document.getElementById('track-detail');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    (async () => {
        const track = await getTrackById(id);
        if (!track) { container.innerHTML = 'Ошибка загрузки'; return; }
        container.innerHTML = `
            <div style="display:flex; flex-wrap:wrap; gap:20px;">
                <img src="${track.album.cover}" alt="Обложка" style="width:250px; border-radius:15px; box-shadow:0 8px 20px rgba(0,0,0,0.6);">
                <div style="flex:1; min-width:200px;">
                    <h2>${track.title}</h2>
                    <p>Артист: ${track.artist.name}</p>
                    <p>Альбом: ${track.album.title}</p>
                    <p>Длительность: ${Math.floor(track.duration/60)}:${track.duration%60}</p>
                    <audio controls src="${track.preview}"></audio>
                    <button onclick='toggleFavorite(${JSON.stringify(track).replace(/'/g,"\\'")})'>❤ Добавить / Убрать</button>
                </div>
            </div>
        `;
    })();
}

if (document.getElementById('fav-list')) renderFavorites(document.getElementById('fav-list'));

if (document.getElementById('dark-mode')) {
    const darkMode = document.getElementById('dark-mode');
    darkMode.checked = localStorage.getItem('dark-mode') === 'true';
    setTheme(darkMode.checked);
    darkMode.addEventListener('change', () => {
        setTheme(darkMode.checked);
        localStorage.setItem('dark-mode', darkMode.checked);
    });
}

if (document.getElementById('clear-fav')) {
    document.getElementById('clear-fav').addEventListener('click', () => {
        localStorage.removeItem(KEY);
        alert('Избранное очищено!');
    });
}

function setTheme(isDark) {
    document.body.style.background = isDark ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'linear-gradient(135deg, #ffffff, #d1d5db)';
    document.body.style.color = isDark ? '#fff' : '#000';
}

if (document.getElementById('stats-container')) {
    const container = document.getElementById('stats-container');
    const favorites = getFavorites();
    const searchCount = localStorage.getItem('search-count') || 0;

    const artistsCount = {};
    favorites.forEach(t => {
        const name = t.artist.name;
        artistsCount[name] = (artistsCount[name] || 0) + 1;
    });
    const topArtists = Object.entries(artistsCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

    container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:15px;">
            <div class="card"><h4>Поисков за сессию</h4><p>${searchCount}</p></div>
            <div class="card"><h4>Избранных треков</h4><p>${favorites.length}</p></div>
            <div class="card"><h4>Топ-5 артистов</h4><ul>${topArtists.map(a=>`<li>${a[0]} (${a[1]})</li>`).join('')}</ul></div>
        </div>
    `;
}
