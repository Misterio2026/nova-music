// Biblioteca inicial: se carga sola desde songs.js (window.SONGS).
let songs = Array.isArray(window.SONGS) ? window.SONGS.slice() : [];
let currentSong = 0;

// Vista actual y favoritos (se recuerdan en el navegador).
let currentView = "all"; // "all" | "favs"
let favs = new Set(JSON.parse(localStorage.getItem("nova_favs") || "[]"));
function saveFavs(){ localStorage.setItem("nova_favs", JSON.stringify([...favs])); }
function isFav(song){ return favs.has(song.file); }
function toggleFav(song){
    if (favs.has(song.file)) favs.delete(song.file); else favs.add(song.file);
    saveFavs();
    renderSongs();
}
function fmt(t){
    if (!t || isNaN(t) || !isFinite(t)) return "0:00";
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ":" + String(s).padStart(2, "0");
}

const picker = document.getElementById("musicPicker");
const search = document.getElementById("search");
const songList = document.getElementById("songList");

const audio = document.getElementById("audio");

const cover = document.getElementById("cover");
const title = document.getElementById("title");

const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

const progress = document.getElementById("progress");
const volume = document.getElementById("volume");
const curTime = document.getElementById("curTime");
const durTime = document.getElementById("durTime");

const navInicio = document.getElementById("navInicio");
const navFavoritos = document.getElementById("navFavoritos");
const navBiblioteca = document.getElementById("navBiblioteca");

// ===== Visualizador real (Web Audio API) =====
const vis = document.querySelector(".visualizer");
const bars = vis.querySelectorAll("div");
let audioCtx, analyser, dataArray, sourceNode;

function setupAudioContext(){
    // En archivos locales (file://) enrutar el audio por Web Audio lo SILENCIA (origen único del navegador).
    // Para no romper la reproducción, no lo enrutamos: el visualizador queda decorativo (igual se anima).
    // Servido por http/https sí funciona el visualizador real.
    if (location.protocol === "file:") return;
    if (audioCtx){ if (audioCtx.state === "suspended") audioCtx.resume(); return; }
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioCtx.createMediaElementSource(audio);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        renderBars();
    } catch (e) {
        console.warn("Visualizador real no disponible:", e);
    }
}

function renderBars(){
    requestAnimationFrame(renderBars);
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);

    let max = 0;
    for (let i = 0; i < dataArray.length; i++) if (dataArray[i] > max) max = dataArray[i];

    // Si no hay datos mientras suena (típico al abrir como archivo local), dejamos la animación decorativa.
    if (max === 0 && !audio.paused) {
        if (vis.classList.contains("live")) {
            vis.classList.remove("live");
            bars.forEach(b => (b.style.height = ""));
        }
        return;
    }
    if (max > 0) vis.classList.add("live");

    if (vis.classList.contains("live")) {
        bars.forEach((bar, i) => {
            const v = dataArray[i * 3] || 0; // 0..255
            bar.style.height = (8 + (v / 255) * 82) + "px";
        });
    }
}

picker.addEventListener("change", () => {

    // Suma los archivos elegidos a la biblioteca (no la reemplaza).
    for (const file of picker.files) {

        songs.push({
            title: file.name.replace(/\.[^/.]+$/, ""),
            file: URL.createObjectURL(file)
        });

    }

    renderSongs();

    picker.value = "";

});

function renderSongs() {

    const q = (search.value || "").toLowerCase();

    songList.innerHTML = "";

    const lista = songs.filter(song =>
        (currentView !== "favs" || isFav(song)) &&
        song.title.toLowerCase().includes(q)
    );

    lista.forEach(song => {

        const index = songs.indexOf(song); // índice REAL (no el de la lista filtrada)

        const div = document.createElement("div");

        div.className = "songCard" + (index === currentSong && audio.src ? " playing" : "");

        div.innerHTML = `
            <div class="songIcon">🎵</div>

            <div class="songInfo">
                <h3>${song.title}</h3>
                <p>Archivo MP4</p>
            </div>

            <i class="favorite fa-${isFav(song) ? "solid" : "regular"} fa-heart"></i>
        `;

        div.onclick = () => {
            currentSong = index;
            loadSong(index);
        };

        div.querySelector(".favorite").onclick = (e) => {
            e.stopPropagation();
            toggleFav(song);
        };

        songList.appendChild(div);

    });

    if (currentView === "favs" && lista.length === 0) {
        songList.innerHTML = `<p style="color:#8fa3d6;padding:10px;line-height:1.5;">Todavía no tenés favoritos.<br>Tocá el ♡ de una canción para agregarla.</p>`;
    }

}

function loadSong(index){

    setupAudioContext();

    audio.src = songs[index].file;

    title.textContent = songs[index].title;

    cover.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2328C7FF'/%3E%3Cstop offset='0.5' stop-color='%23A044FF'/%3E%3Cstop offset='1' stop-color='%23FF4FD8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='500' height='500' rx='40' fill='url(%23g)'/%3E%3Ctext x='250' y='250' font-size='220' text-anchor='middle' dominant-baseline='central'%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E";

    audio.play();

    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

    cover.style.animation = "rotateAlbum 20s linear infinite";

    renderSongs(); // actualiza el resaltado de la canción que suena

}

playBtn.onclick = ()=>{

    if(!audio.src) return;

    if(audio.paused){

        setupAudioContext();

        audio.play();

        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

        cover.style.animation="rotateAlbum 20s linear infinite";

    }else{

        audio.pause();

        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

        cover.style.animation="none";

    }

};

nextBtn.onclick = () => {

    if (!songs.length) return;

    currentSong++;

    if (currentSong >= songs.length)
        currentSong = 0;

    loadSong(currentSong);

};

prevBtn.onclick = () => {

    if (!songs.length) return;

    currentSong--;

    if (currentSong < 0)
        currentSong = songs.length - 1;

    loadSong(currentSong);

};

audio.addEventListener("loadedmetadata", () => {

    progress.max = audio.duration || 0;

    durTime.textContent = fmt(audio.duration);

});

audio.addEventListener("timeupdate", () => {

    progress.max = audio.duration || 0;

    progress.value = audio.currentTime;

    curTime.textContent = fmt(audio.currentTime);

});

progress.addEventListener("input", () => {

    audio.currentTime = progress.value;

});

audio.addEventListener("ended", () => {

    nextBtn.click();

});

search.addEventListener("input", () => {

    renderSongs();

});

// Menú: Inicio / Biblioteca = toda la biblioteca · Favoritos = solo favoritos.
function setActive(btn){
    [navInicio, navFavoritos, navBiblioteca].forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}
navInicio.onclick = () => { currentView = "all"; setActive(navInicio); renderSongs(); };
navBiblioteca.onclick = () => { currentView = "all"; setActive(navBiblioteca); renderSongs(); };
navFavoritos.onclick = () => { currentView = "favs"; setActive(navFavoritos); renderSongs(); };

volume.addEventListener("input", () => {

    audio.volume = volume.value / 100;

});

audio.volume = 1;

// Muestra la biblioteca apenas se abre la página.
renderSongs();