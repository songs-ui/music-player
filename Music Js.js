const songs = [
  { title: "Legends Never Die", artist: "Against The Current", src: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3", likes: 10, date: "2024-01-01" },
  { title: "The Monster", artist: "Eminem / Rihanna", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", likes: 15, date: "2023-10-15" },
  { title: "Blinding Lights", artist: "The Weeknd", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", likes: 30, date: "2025-01-06" },
  { title: "Shape of You", artist: "Ed Sheeran", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", likes: 20, date: "2022-11-22" },
  { title: "Someone Like You", artist: "Adele", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", likes: 25, date: "2023-12-05" },
  { title: "Stay", artist: "Justin Bieber", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", likes: 18, date: "2022-07-14" },
];

let activePlayer = null;
let currentHowl = null;

document.addEventListener("DOMContentLoaded", () => {
  const songList = document.querySelector(".song-list");

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

  function likeSong(index) {
    const likeCountSpan = document.getElementById(`like-count-${index}`);
    let likeCount = parseInt(likeCountSpan.textContent, 10);
    likeCount += 1;
    likeCountSpan.textContent = likeCount;
    songs[index].likes = likeCount; // Update the like count in the song array
  }

  window.togglePlayer = function(index) {
    const player = document.getElementById(`player-${index}`);
    const playButton = document.querySelector(`#song-${index} .play-button`);
    const progressBar = player.querySelector(".progress-bar");
    const likeButton = player.querySelector(".like-button");

    if (player.style.display === "flex") {
      player.style.display = "none";
      playButton.textContent = "▶";
      progressBar.style.display = "none";
      likeButton.style.display = "none";
      if (currentHowl) currentHowl.pause();
    } else {
      player.style.display = "flex";
      playButton.textContent = "II";
      progressBar.style.display = "block";
      likeButton.style.display = "flex";
      currentHowl = new Howl({ src: [songs[index].src], html5: true });
      currentHowl.play();
    }
  };
});
