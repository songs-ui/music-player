const songs = [
  { title: "Legends Never Die", artist: "Against The Current", src: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3", likes: 10, date: "2024-01-01" },
  { title: "The Monster", artist: "Eminem / Rihanna", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", likes: 15, date: "2023-10-15" },
  { title: "Blinding Lights", artist: "The Weeknd", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", likes: 30, date: "2025-01-06" },
  { title: "Shape of You", artist: "Ed Sheeran", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", likes: 20, date: "2022-11-22" },
  { title: "Someone Like You", artist: "Adele", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", likes: 25, date: "2023-12-05" },
  { title: "Stay", artist: "Justin Bieber", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", likes: 18, date: "2022-07-14" },
];

// Generate 50 test songs
for (let i = 1; i <= 50; i++) {
  songs.push({
    title: `Test Song ${i}`,
    artist: `Test Artist ${i}`,
    src: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i % 16 + 1}.mp3`, // Cycle through 16 example sources
    likes: Math.floor(Math.random() * 100), // Random likes between 0 and 99
    date: `202${Math.floor(Math.random() * 5) + 1}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}` // Random date between 2021-2025
  });
}

let activePlayer = null;
let currentHowl = null;
let likesPerSession = {};
let isDragging = false;
let songProgress = {};
let progressRequestId = null;

document.addEventListener("DOMContentLoaded", () => {
  const songList = document.querySelector(".song-list");
  const searchInput = document.querySelector(".search-bar input");
  const searchClearButton = document.querySelector(".search-clear");
  const sortSelect = document.querySelector("#sort");

  function renderSongs(songsToRender) {
    songList.innerHTML = ""; // Clear existing songs
    songsToRender.forEach((song, index) => {
      const songItem = document.createElement("div");
      songItem.classList.add("song-item");
      songItem.setAttribute("id", `song-${index}`);

      songItem.innerHTML = `
        <div class="song-header">
          <h3>${song.title} <small> <span id="like-count-${index}">${song.likes}</span> ❤ </small></h3>
          <button class="play-button" onclick="togglePlayer(${index})">▶</button>
        </div>
        <p class="song-artist">${song.artist}</p>
        <div id="player-${index}" class="player" style="display: none;">
          <div class="progress-container">
            <div class="progress-bar"></div>
            <div class="progress-ball"></div> 
          </div>
          <button class="like-button" onclick="likeSong(${index})">❤</button>
        </div>
      `;

      songList.appendChild(songItem);
    });

    document.querySelectorAll(".progress-container").forEach((container, index) => {
      container.addEventListener("mousedown", (e) => startDrag(index, e));
      container.addEventListener("touchstart", (e) => startDrag(index, e), { passive: false });
      container.addEventListener("mousemove", (e) => dragProgress(index, e));
      container.addEventListener("touchmove", (e) => dragProgress(index, e));
      container.addEventListener("mouseup", (e) => endDrag(index, e));
      container.addEventListener("touchend", (e) => endDrag(index, e));
    });
  }

  renderSongs(songs); // Initial render

  window.togglePlayer = function (index) {
    const player = document.getElementById(`player-${index}`);
    const playButton = document.querySelector(`#song-${index} .play-button`);
    const progressBar = player.querySelector(".progress-bar");
    const progressBall = player.querySelector(".progress-ball");

    if (activePlayer !== null && activePlayer !== index) {
      const activePlayerElement = document.getElementById(`player-${activePlayer}`);
      const activePlayButton = document.querySelector(`#song-${activePlayer} .play-button`);

      if (currentHowl) currentHowl.stop();
      activePlayerElement.style.display = "none";
      activePlayButton.textContent = "▶";
      cancelAnimationFrame(progressRequestId);

      // Reset the progress bar and save state
      songProgress[activePlayer] = 0;
      const activeProgressBar = activePlayerElement.querySelector(".progress-bar");
      const activeProgressBall = activePlayerElement.querySelector(".progress-ball");
      activeProgressBar.style.width = "0%";
      activeProgressBall.style.left = "0%";
    }

    if (player.style.display === "flex") {
      player.style.display = "none";
      playButton.textContent = "▶";
      cancelAnimationFrame(progressRequestId);
      if (currentHowl) currentHowl.pause();
      songProgress[index] = currentHowl.seek();
      activePlayer = null;
    } else {
      player.style.display = "flex";
      playButton.textContent = "II";

      if (currentHowl) currentHowl.stop();

      currentHowl = new Howl({
        src: [songs[index].src],
        html5: true,
        onend: () => {
          playButton.textContent = "▶";
          cancelAnimationFrame(progressRequestId);
        },
      });

      currentHowl.seek(songProgress[index] || 0);
      currentHowl.play();
      activePlayer = index;

      function updateProgress() {
        if (currentHowl && !isDragging) {
          const progress = (currentHowl.seek() / currentHowl.duration()) * 100;
          progressBar.style.width = `${progress}%`;
          progressBall.style.left = `${progress}%`;
          progressRequestId = requestAnimationFrame(updateProgress);
        }
      }

      updateProgress();
    }
  };

  window.startDrag = function (index, event) {
    isDragging = true;
    event.preventDefault(); // Prevent page scroll during drag
    dragProgress(index, event); // Initialize the drag
  };

  window.dragProgress = function (index, event) {
    if (!isDragging) return;

    const player = document.getElementById(`player-${index}`);
    const progressContainer = player.querySelector(".progress-container");
    const progressBar = progressContainer.querySelector(".progress-bar");
    const progressBall = progressContainer.querySelector(".progress-ball");
    const rect = progressContainer.getBoundingClientRect();

    const clientX = event.clientX || (event.touches && event.touches[0].clientX);

    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    progressBar.style.width = `${percentage * 100}%`;
    progressBall.style.left = `${percentage * 100}%`;

    if (currentHowl) {
      const newTime = percentage * currentHowl.duration();
      currentHowl.seek(newTime);
    }
  };

  window.endDrag = function (index, event) {
    if (!isDragging) return;
    isDragging = false;
    dragProgress(index, event);
  };

  window.likeSong = function (index) {
    const likeCountSpan = document.getElementById(`like-count-${index}`);
    let likeCount = parseInt(likeCountSpan.textContent, 10);

    if (!likesPerSession[index]) {
      likesPerSession[index] = 0;
    }

    if (likesPerSession[index] < 5) {
      likesPerSession[index] += 1;
      likeCount += 1;
      likeCountSpan.textContent = likeCount;
      songs[index].likes = likeCount;
    } else {
      alert("You've already liked this song 5 times in this session!");
    }
  };

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredSongs = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm)
    );
    renderSongs(filteredSongs);

    searchClearButton.style.display = searchTerm.trim() !== "" ? "block" : "none";
  });

  searchClearButton.addEventListener("click", () => {
    searchInput.value = "";
    renderSongs(songs);
    searchClearButton.style.display = "none";
  });

  sortSelect.addEventListener("change", () => {
  const sortValue = sortSelect.value;
  console.log('Sort Value:', sortValue); // Log sort value
  let sortedSongs;

  switch (sortValue) {
    case "alphabetical":
      sortedSongs = [...songs].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "most-liked":
      sortedSongs = [...songs].sort((a, b) => b.likes - a.likes);
      break;
    case "most-recent":
      sortedSongs = [...songs].sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    default:
      sortedSongs = [...songs];
      break;
  }

  console.log('Sorted Songs:', sortedSongs); // Log the sorted songs array
  renderSongs(sortedSongs);
});


});
