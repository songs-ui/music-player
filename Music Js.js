// Supabase Configuration
const SUPABASE_URL = "https://pzubpkxmwtatazpsckje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dWJwa3htd3RhdGF6cHNja2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5ODM1MTUsImV4cCI6MjA1MTU1OTUxNX0.O4P_nxMa2KDSBoPfVzQa7QrOqKsMt85MvSlSEhBFVtA";

// Initialize Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Variables
let activePlayer = null;
let currentHowl = null;
let isDragging = false;
let progressRequestId = null;
let songs = [];

// Fetch songs from Supabase
async function fetchSongs() {
  const { data, error } = await supabase.from("songs").select("*");
  if (error) {
    console.error("Error fetching songs:", error);
    return;
  }
  songs = data;
  renderSongs(songs);
}

// Render Songs
function renderSongs(songsToRender) {
  const songList = document.querySelector(".song-list");
  songList.innerHTML = ""; // Clear existing songs

  songsToRender.forEach((song, index) => {
    const songItem = document.createElement("div");
    songItem.classList.add("song-item");
    songItem.setAttribute("id", `song-${index}`);

    songItem.innerHTML = `
      <div class="song-header">
        <h3>${song.title} <small><span id="like-count-${index}">${song.likes}</span> ❤</small></h3>
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

    // Add event listeners for progress bar drag
    const progressContainer = songItem.querySelector(".progress-container");
    progressContainer.addEventListener("mousedown", (e) => startDrag(index, e));
    progressContainer.addEventListener("mousemove", (e) => dragProgress(index, e));
    progressContainer.addEventListener("mouseup", (e) => endDrag(index, e));
  });
}

// Toggle Player
window.togglePlayer = function (index) {
  const player = document.getElementById(`player-${index}`);
  const playButton = document.querySelector(`#song-${index} .play-button`);
  const progressBar = player.querySelector(".progress-bar");

  if (activePlayer !== null && activePlayer !== index) {
    const activePlayerElement = document.getElementById(`player-${activePlayer}`);
    const activePlayButton = document.querySelector(`#song-${activePlayer} .play-button`);
    if (currentHowl) currentHowl.stop();
    activePlayerElement.style.display = "none";
    activePlayButton.textContent = "▶";
    cancelAnimationFrame(progressRequestId);
  }

  if (player.style.display === "flex") {
    player.style.display = "none";
    playButton.textContent = "▶";
    cancelAnimationFrame(progressRequestId);
    if (currentHowl) currentHowl.pause();
    activePlayer = null;
  } else {
    player.style.display = "flex";
    playButton.textContent = "II";
    currentHowl = new Howl({
      src: [songs[index].src],
      html5: true,
      onend: () => {
        playButton.textContent = "▶";
        cancelAnimationFrame(progressRequestId);
      },
    });
    currentHowl.play();
    activePlayer = index;

    function updateProgress() {
      if (currentHowl && !isDragging) {
        const progress = (currentHowl.seek() / currentHowl.duration()) * 100;
        progressBar.style.width = `${progress}%`;
        progressRequestId = requestAnimationFrame(updateProgress);
      }
    }
    updateProgress();
  }
};

// Like Song
window.likeSong = async function (index) {
  const likeCountSpan = document.getElementById(`like-count-${index}`);
  const likeCount = parseInt(likeCountSpan.textContent, 10) + 1;

  // Update likes in Supabase
  const { error } = await supabase
    .from("songs")
    .update({ likes: likeCount })
    .eq("id", songs[index].id);

  if (error) {
    console.error("Error updating likes:", error);
    return;
  }

  likeCountSpan.textContent = likeCount;
  songs[index].likes = likeCount;
};

// Drag Progress Bar
window.startDrag = function (index, event) {
  isDragging = true;
  dragProgress(index, event);
};
window.dragProgress = function (index, event) {
  if (!isDragging) return;
  const player = document.getElementById(`player-${index}`);
  const progressContainer = player.querySelector(".progress-container");
  const progressBar = progressContainer.querySelector(".progress-bar");
  const rect = progressContainer.getBoundingClientRect();
  const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  progressBar.style.width = `${percentage * 100}%`;
  if (currentHowl) currentHowl.seek(percentage * currentHowl.duration());
};

// Fetch Songs on Page Load
document.addEventListener("DOMContentLoaded", fetchSongs);

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
