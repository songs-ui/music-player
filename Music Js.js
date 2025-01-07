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

document.addEventListener("DOMContentLoaded", () => {
  const songList = document.querySelector(".song-list");
  const searchInput = document.querySelector(".search-bar input");
  const searchClearButton = document.querySelector(".search-clear");

  // Function to render the songs
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
          <div class="progress-bar"></div>
          <button class="like-button" onclick="likeSong(${index})">❤</button>
        </div>
      `;

      songList.appendChild(songItem);
    });
  }

  renderSongs(songs); // Initial render

  // Function to sort the songs based on the selected option
  window.sortSongs = function() {
    const sortOption = document.getElementById('sort').value;

    if (sortOption === "alphabetical") {
      songs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === "most-liked") {
      songs.sort((a, b) => b.likes - a.likes);
    } else if (sortOption === "most-recent") {
      songs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    renderSongs(songs); // Re-render the sorted songs
  };

  // Function to like a song
  window.likeSong = function(index) {
    const likeCountSpan = document.getElementById(`like-count-${index}`);
    let likeCount = parseInt(likeCountSpan.textContent, 10);

    // Initialize the like count for the song if it doesn't exist yet
    if (!likesPerSession[index]) {
      likesPerSession[index] = 0;
    }

    // Ensure the user can only like the song up to 5 times
    if (likesPerSession[index] < 5) {
      likesPerSession[index] += 1; // Increment likes for the current session
      likeCount += 1;
      likeCountSpan.textContent = likeCount;
      songs[index].likes = likeCount; // Update the like count in the song array
    } else {
      alert("You've already liked this song 5 times in this session!");
    }
  };

  // Function to toggle the audio player
  window.togglePlayer = function(index) {
    const player = document.getElementById(`player-${index}`);
    const playButton = document.querySelector(`#song-${index} .play-button`);
    const progressBar = player.querySelector(".progress-bar");
    const likeButton = player.querySelector(".like-button");

    // If another song is playing, stop it first
    if (activePlayer !== null && activePlayer !== index && currentHowl) {
      currentHowl.pause(); // Pause the current song
      const activeSongPlayer = document.getElementById(`player-${activePlayer}`);
      const activePlayButton = activeSongPlayer.querySelector(".play-button");
      activeSongPlayer.style.display = "none"; // Hide the current player's controls
      activePlayButton.textContent = "▶"; // Reset the play button
    }

    // Now toggle the selected song
    if (player.style.display === "flex") {
      player.style.display = "none";
      playButton.textContent = "▶";
      progressBar.style.display = "none";
      likeButton.style.display = "none";
      if (currentHowl) currentHowl.pause(); // Pause the current song
      activePlayer = null; // No song is currently playing
    } else {
      player.style.display = "flex";
      playButton.textContent = "II"; // Change button text to pause
      progressBar.style.display = "block";
      likeButton.style.display = "flex";
      currentHowl = new Howl({ src: [songs[index].src], html5: true });
      currentHowl.play();
      activePlayer = index; // Set the active song to the current song
    }
  };

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filteredSongs = songs.filter(song => 
      song.title.toLowerCase().includes(query) || 
      song.artist.toLowerCase().includes(query)
    );
    renderSongs(filteredSongs); // Re-render the filtered songs
    searchClearButton.style.display = query.length > 0 ? 'block' : 'none'; // Show 'X' if there's input
  });

  // Clear search input when 'X' is clicked
  searchClearButton.addEventListener("click", () => {
    searchInput.value = '';
    searchClearButton.style.display = 'none';
    renderSongs(songs); // Re-render all songs
  });
});
