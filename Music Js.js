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
let songProgress = {}; // Track progress for each song

document.addEventListener("DOMContentLoaded", () => {
  const songList = document.querySelector(".song-list");
  const searchInput = document.querySelector(".search-bar input");
  const searchClearButton = document.querySelector(".search-clear");
  const sortSelect = document.querySelector("#sort"); // Corrected selector here

  function renderSongs(songsToRender) {
    songList.innerHTML = ''; // Clear the existing songs
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
      songProgress[index] = currentHowl.seek(); // Save progress when paused
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

      // Retrieve saved progress if available
      if (songProgress[index]) {
        currentHowl.seek(songProgress[index]); // Resume from the saved progress
      }

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

  // Prevent scrolling when dragging the progress bar
  document.body.addEventListener('touchmove', (e) => {
    if (isDragging) {
      e.preventDefault(); // Prevent scrolling
    }
  }, { passive: false });

  // Stop playing music when the page is not visible (background)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentHowl) {
      currentHowl.pause(); // Pause if the page is hidden
    }
  });

  // Search functionality
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredSongs = songs.filter(song => 
      song.title.toLowerCase().includes(searchTerm) || 
      song.artist.toLowerCase().includes(searchTerm)
    );
    renderSongs(filteredSongs); // Render filtered songs based on search input

    // Show the clear button when there is text in the search bar
    if (searchTerm.trim() !== "") {
      searchClearButton.style.display = "block";
    } else {
      searchClearButton.style.display = "none";
    }
  });

  // Clear search functionality
  searchClearButton.addEventListener("click", () => {
    searchInput.value = '';
    renderSongs(songs); // Render all songs again
    searchClearButton.style.display = "none"; // Hide the clear button
  });

  // Sort functionality
  sortSelect.addEventListener("change", () => {
    const sortBy = sortSelect.value;
    let sortedSongs = [...songs];

    if (sortBy === 'alphabetical') {
      sortedSongs.sort((a, b) => a.title.localeCompare(b.title)); // Sort by title (alphabetical)
    } else if (sortBy === 'most-liked') {
      sortedSongs.sort((a, b) => b.likes - a.likes); // Sort by likes
    } else if (sortBy === 'most-recent') {
      sortedSongs.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date
    }

    renderSongs(sortedSongs); // Render sorted songs
  });
});
