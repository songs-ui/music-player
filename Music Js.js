// Supabase Initialization
const supabaseUrl = "https://pzubpkxmwtatazpsckje.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dWJwa3htd3RhdGF6cHNja2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5ODM1MTUsImV4cCI6MjA1MTU1OTUxNX0.O4P_nxMa2KDSBoPfVzQa7QrOqKsMt85MvSlSEhBFVtA";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Predefined Songs
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
    src: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i % 16 + 1}.mp3`,
    likes: Math.floor(Math.random() * 100),
    date: `202${Math.floor(Math.random() * 5) + 1}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  });
}

// Insert Songs into Supabase
async function insertSongsIntoSupabase() {
  const { data, error } = await supabase.from("songs").insert(songs);
  if (error) {
    console.error("Error inserting songs:", error);
  } else {
    console.log("Songs inserted successfully:", data);
  }
}

// Ensure songs are inserted only once (uncomment to run once)
// insertSongsIntoSupabase();

// Global Variables
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
    // Logic for toggling the player (as in the original code)
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

      // Update the likes in Supabase
      supabase
        .from("songs")
        .update({ likes: likeCount })
        .eq("title", songs[index].title)
        .then(({ error }) => {
          if (error) console.error("Error updating likes:", error);
        });
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

    renderSongs(sortedSongs);
  });
});
