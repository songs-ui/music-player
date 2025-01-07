const songs = [
  { title: "Legends Never Die", artist: "Against The Current", src: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3", likes: 10, date: "2024-01-01" },
  { title: "The Monster", artist: "Eminem / Rihanna", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", likes: 15, date: "2023-10-15" },
  { title: "Blinding Lights", artist: "The Weeknd", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", likes: 30, date: "2025-01-06" },
  { title: "Shape of You", artist: "Ed Sheeran", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", likes: 20, date: "2022-11-22" },
  { title: "Someone Like You", artist: "Adele", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", likes: 25, date: "2023-12-05" },
  { title: "Stay", artist: "Justin Bieber", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", likes: 18, date: "2022-07-14" },
];

let activePlayer = null;  // Track the currently active player
let currentHowl = null;   // Track the Howl instance for the current song
let likesPerSession = {}; // Track likes per session for each song
let progressInterval = null; // For updating the progress bar
let isDragging = false; // Track whether the user is dragging the progress bar

document.addEventListener("DOMContentLoaded", () => {
  const songList = document.querySelector(".song-list");
  const searchInput = document.querySelector(".search-bar input");
  const searchClearButton = document.querySelector(".search-clear");

  function renderSongs(songs) {
    songList.innerHTML = ''; // Clear the existing songs
    songs.forEach((song, index) => {
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
          </div>
          <button class="like-button" onclick="likeSong(${index})">❤</button>
        </div>
      `;

      songList.appendChild(songItem);
    });

    // Add drag-and-tap event listeners to progress bars
    document.querySelectorAll('.progress-container').forEach((container, index) => {
      container.addEventListener('mousedown', (e) => startDrag(index, e));
      container.addEventListener('touchstart', (e) => startDrag(index, e), { passive: true });
      container.addEventListener('mousemove', (e) => dragProgress(index, e));
      container.addEventListener('touchmove', (e) => dragProgress(index, e));
      container.addEventListener('mouseup', (e) => endDrag(index, e));
      container.addEventListener('touchend', (e) => endDrag(index, e));
    });
  }

  renderSongs(songs); // Initial render

  window.togglePlayer = function (index) {
    const player = document.getElementById(`player-${index}`);
    const playButton = document.querySelector(`#song-${index} .play-button`);
    const progressBar = player.querySelector(".progress-bar");

    if (activePlayer !== null && activePlayer !== index) {
      const activePlayerElement = document.getElementById(`player-${activePlayer}`);
      const activePlayButton = document.querySelector(`#song-${activePlayer} .play-button`);

      if (currentHowl) currentHowl.stop(); // Stop the currently playing song
      activePlayerElement.style.display = "none"; // Hide the player's controls
      activePlayButton.textContent = "▶"; // Reset the play button
      clearInterval(progressInterval); // Stop the progress interval for the previous song
    }

    if (player.style.display === "flex") {
      player.style.display = "none";
      playButton.textContent = "▶";
      clearInterval(progressInterval); // Stop progress updates
      if (currentHowl) currentHowl.pause(); // Pause the current song
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
          clearInterval(progressInterval);
        }
      });

      currentHowl.play();
      activePlayer = index;

      progressInterval = setInterval(() => {
        if (currentHowl && !isDragging) {
          const progress = (currentHowl.seek() / currentHowl.duration()) * 100;
          progressBar.style.width = `${progress}%`;
        }
      }, 100);
    }
  };

  function startDrag(index, event) {
    isDragging = true;
    dragProgress(index, event);
  }

  function dragProgress(index, event) {
    if (!isDragging) return;

    const player = document.getElementById(`player-${index}`);
    const progressContainer = player.querySelector(".progress-container");
    const progressBar = progressContainer.querySelector(".progress-bar");
    const rect = progressContainer.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

    if (currentHowl) {
      progressBar.style.width = `${percentage * 100}%`;
      currentHowl.seek(percentage * currentHowl.duration());
    }
  }

  function endDrag(index, event) {
    isDragging = false;
    dragProgress(index, event);
  }

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
      songs[index].likes = likeCount; // Update the like count in the song array
    } else {
      alert("You've already liked this song 5 times in this session!");
    }
  };
});
