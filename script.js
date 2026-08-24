let songs = [];
let currentSong = 0;

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

picker.addEventListener("change", () => {

    songs = [];

    for (const file of picker.files) {

        songs.push({
            title: file.name.replace(/\.[^/.]+$/, ""),
            file: URL.createObjectURL(file)
        });

    }

    renderSongs();

});

function renderSongs(filter = "") {

    songList.innerHTML = "";

    songs
    .filter(song =>
        song.title.toLowerCase().includes(filter.toLowerCase())
    )
    .forEach((song,index)=>{

        const div = document.createElement("div");

        div.className = "songCard";

        div.innerHTML = `
            <div class="songIcon">🎵</div>

            <div class="songInfo">
                <h3>${song.title}</h3>
                <p>Archivo MP4</p>
            </div>
        `;

        div.onclick = () => {

            currentSong = index;

            loadSong(index);

        };

        songList.appendChild(div);

    });

}

function loadSong(index){

    audio.src = songs[index].file;

    title.textContent = songs[index].title;

    cover.src = "https://placehold.co/500x500/111629/ffffff?text=%F0%9F%8E%B5";

    audio.play();

    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

    cover.style.animation = "rotateAlbum 20s linear infinite";

}

playBtn.onclick = ()=>{

    if(!audio.src) return;

    if(audio.paused){

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

audio.addEventListener("timeupdate", () => {

    progress.max = audio.duration || 0;

    progress.value = audio.currentTime;

});

progress.addEventListener("input", () => {

    audio.currentTime = progress.value;

});

audio.addEventListener("ended", () => {

    nextBtn.click();

});

search.addEventListener("input", (e) => {

    renderSongs(e.target.value);

});

volume.addEventListener("input", () => {

    audio.volume = volume.value / 100;

});

audio.volume = 1;
