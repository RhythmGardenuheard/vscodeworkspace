// 模擬歌曲數據
const songs = [
    { id: 1, title: '夏日戀歌', artist: '月亮樂隊', emoji: '🌙', duration: 240 },
    { id: 2, title: '星夜傳說', artist: '星光合唱團', emoji: '⭐', duration: 210 },
    { id: 3, title: '雨夜漫步', artist: '城市之聲', emoji: '🌧️', duration: 185 },
    { id: 4, title: '心動時刻', artist: '浪漫主義', emoji: '💖', duration: 220 },
    { id: 5, title: '山巔的呼喚', artist: '野外樂隊', emoji: '🏔️', duration: 195 },
    { id: 6, title: '甜蜜夢境', artist: '夢幻小隊', emoji: '🎪', duration: 215 },
    { id: 7, title: '城市燈光', artist: '都市漫步', emoji: '🌃', duration: 200 },
    { id: 8, title: '樂園尋夢', artist: '冒險家族', emoji: '🎢', duration: 230 },
];

let currentSongIndex = 0;
let isPlaying = false;
let likedSongs = new Set();
let currentTime = 0;
let currentSongDuration = 0;
let playbackRate = 1;

// DOM 元素
const songGrid = document.getElementById('songs-grid');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentSongEl = document.getElementById('current-song');
const currentArtistEl = document.getElementById('current-artist');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeControl = document.getElementById('volume-control');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');

// 初始化頁面
function init() {
    renderSongs();
    setupEventListeners();
    loadLibrary();
}

// 渲染歌曲網格
function renderSongs() {
    songGrid.innerHTML = '';
    songs.forEach((song) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-cover">${song.emoji}</div>
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
            <div class="song-actions">
                <button class="song-btn play-song-btn" data-id="${song.id}">▶ 播放</button>
                <button class="song-btn like ${likedSongs.has(song.id) ? 'liked' : ''}" data-id="${song.id}">❤️</button>
            </div>
        `;
        songGrid.appendChild(card);

        // 播放按鈕
        card.querySelector('.play-song-btn').addEventListener('click', () => {
            currentSongIndex = songs.findIndex(s => s.id === song.id);
            playSong();
        });

        // 喜歡按鈕
        card.querySelector('.like').addEventListener('click', (e) => {
            toggleLike(song.id, e.target);
        });
    });
}

// 播放歌曲
function playSong() {
    currentTime = 0;
    const song = songs[currentSongIndex];
    currentSongEl.textContent = song.title;
    currentArtistEl.textContent = song.artist;
    currentSongDuration = song.duration;
    durationEl.textContent = formatTime(currentSongDuration);
    
    isPlaying = true;
    playBtn.textContent = '⏸';
    
    // 模擬播放進度
    simulatePlayback();
}

// 暫停歌曲
function pauseSong() {
    isPlaying = false;
    playBtn.textContent = '▶';
}

// 模擬播放進度
let playbackInterval;
function simulatePlayback() {
    clearInterval(playbackInterval);
    if (isPlaying) {
        playbackInterval = setInterval(() => {
            currentTime += 0.1;
            updateProgress();
            
            if (currentTime >= currentSongDuration) {
                nextSong();
            }
        }, 100);
    }
}

// 更新進度条
function updateProgress() {
    const percent = (currentTime / currentSongDuration) * 100;
    progressFill.style.width = percent + '%';
    currentTimeEl.textContent = formatTime(Math.floor(currentTime));
}

// 格式化時間
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 下一首歌
function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong();
}

// 上一首歌
function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong();
}

// 切換喜歡
function toggleLike(songId, button) {
    if (likedSongs.has(songId)) {
        likedSongs.delete(songId);
        button.classList.remove('liked');
    } else {
        likedSongs.add(songId);
        button.classList.add('liked');
    }
    saveLibrary();
    loadLibrary();
}

// 保存和加載音樂庫
function saveLibrary() {
    localStorage.setItem('likedSongs', JSON.stringify(Array.from(likedSongs)));
}

function loadLibrary() {
    const saved = localStorage.getItem('likedSongs');
    if (saved) {
        likedSongs = new Set(JSON.parse(saved));
    }
    updateLibraryDisplay();
}

function updateLibraryDisplay() {
    const libraryContent = document.getElementById('library-content');
    const likedSongsList = songs.filter(s => likedSongs.has(s.id));
    
    if (likedSongsList.length === 0) {
        libraryContent.innerHTML = '<p class="empty-state">還沒有保存任何歌曲。在歌曲卡片上按❤️來添加</p>';
        return;
    }
    
    libraryContent.innerHTML = `
        <div class="songs-grid">
            ${likedSongsList.map(song => `
                <div class="song-card">
                    <div class="song-cover">${song.emoji}</div>
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                    <div class="song-actions">
                        <button class="song-btn play-song-btn" data-id="${song.id}">▶ 播放</button>
                        <button class="song-btn like liked" data-id="${song.id}">❤️</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // 為音樂庫中的歌曲添加事件監聽器
    libraryContent.querySelectorAll('.play-song-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSongIndex = songs.findIndex(s => s.id === parseInt(btn.dataset.id));
            playSong();
        });
    });
    
    libraryContent.querySelectorAll('.like').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleLike(parseInt(btn.dataset.id), btn);
        });
    });
}

// 設置事件監聽器
function setupEventListeners() {
    // 播放控制
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseSong();
            clearInterval(playbackInterval);
        } else {
            if (currentSongIndex === 0 && currentTime === 0) {
                playSong();
            } else {
                isPlaying = true;
                playBtn.textContent = '⏸';
                simulatePlayback();
            }
        }
    });

    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);

    // 進度條點擊
    const progressBar = document.querySelector('.progress-bar');
    progressBar.addEventListener('click', (e) => {
        const percent = e.offsetX / progressBar.offsetWidth;
        currentTime = percent * currentSongDuration;
        updateProgress();
    });

    // 音量控制
    volumeControl.addEventListener('input', (e) => {
        console.log('音量調整至:', e.target.value);
    });

    // 導航
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 移除所有 active 類
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // 添加 active 類
            item.classList.add('active');
            const sectionId = item.dataset.section + '-section';
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// 啟動應用
init();
