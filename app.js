// 1. SUPABASE SETUP
const SUPABASE_URL = 'https://emuydrvfmzkblwifyisv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdXlkcnZmbXprYmx3aWZ5aXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDA1NDgsImV4cCI6MjA3MTM3NjU0OH0.SzPdRdjJCNrXEg0rm-waP6puAOv8I45OR6DBOdSxGKs';
const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// 2. DOM ELEMENTS
// ... (omitting unchanged elements for brevity)
const libraryGrid = document.querySelector('#library-grid');
// Player Modal Elements
const playerModal = new bootstrap.Modal(document.querySelector('#player-modal'));
const playerBookTitle = document.querySelector('#player-book-title');
const playerCoverArt = document.querySelector('#player-cover-art');
const playerChapterTitle = document.querySelector('#player-chapter-title');
const playerBookAuthor = document.querySelector('#player-book-author');
const audioPlayer = document.querySelector('#audio-player');
const playPauseBtn = document.querySelector('#play-pause-btn');
const prevChapterBtn = document.querySelector('#prev-chapter-btn');
const nextChapterBtn = document.querySelector('#next-chapter-btn');

// State for the player
let currentBook = null;
let currentChapterIndex = 0;


// 3. AUTHENTICATION & SESSION (Unchanged)
// ...

// 4. UI MANAGEMENT (Unchanged)
// ...

// 5. BOOK IMPORTING (Unchanged)
// ...

// 6. LIBRARY DISPLAY
async function displayBooks() {
  libraryGrid.innerHTML = '<h2>Loading library...</h2>';
  const { data: books, error } = await supabase.from('books').select('*');
  if (error) { /* ... error handling ... */ return; }
  if (books.length === 0) { /* ... empty library message ... */ return; }

  libraryGrid.innerHTML = '';
  for (const book of books) {
    const coverBlob = await idbKeyval.get(book.cover_image_url);
    const coverUrl = coverBlob ? URL.createObjectURL(coverBlob) : 'https://via.placeholder.com/300x300.png?text=No+Cover';
    
    const card = document.createElement('div');
    card.className = 'col-6 col-md-4 col-lg-3 mb-4';
    card.innerHTML = `
      <div class="card" role="button" data-book-id="${book.id}">
        <img src="${coverUrl}" class="card-img-top" alt="${book.title}">
        <div class="card-body">
          <h5 class="card-title text-truncate">${book.title}</h5>
          <p class="card-text text-truncate text-muted">${book.author}</p>
        </div>
      </div>
    `;
    libraryGrid.appendChild(card);
  }
}

// 7. PLAYER LOGIC
libraryGrid.addEventListener('click', async (e) => {
  const card = e.target.closest('.card');
  if (!card) return;

  const bookId = card.dataset.bookId;
  const { data: bookData, error } = await supabase.from('books').select('*').eq('id', bookId).single();
  
  if (error) {
    alert('Error fetching book details.');
    console.error(error);
    return;
  }

  currentBook = bookData;
  currentChapterIndex = 0; // Start from the first chapter
  loadChapter();
  playerModal.show();
});

async function loadChapter() {
  if (!currentBook || !currentBook.chapters[currentChapterIndex]) return;

  // Update modal text
  playerBookTitle.textContent = currentBook.title;
  playerBookAuthor.textContent = currentBook.author;
  playerChapterTitle.textContent = `Chapter ${currentChapterIndex + 1}`;

  // Load cover art
  const coverBlob = await idbKeyval.get(currentBook.cover_image_url);
  playerCoverArt.src = coverBlob ? URL.createObjectURL(coverBlob) : '';

  // Load audio
  const chapterKey = currentBook.chapters[currentChapterIndex];
  const audioBlob = await idbKeyval.get(chapterKey);
  if (audioBlob) {
    audioPlayer.src = URL.createObjectURL(audioBlob);
  }
}

playPauseBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.textContent = '⏸️';
  } else {
    audioPlayer.pause();
    playPauseBtn.textContent = '▶️';
  }
});

nextChapterBtn.addEventListener('click', () => {
  if (currentChapterIndex < currentBook.chapters.length - 1) {
    currentChapterIndex++;
    loadChapter();
    audioPlayer.play();
  }
});

prevChapterBtn.addEventListener('click', () => {
  if (currentChapterIndex > 0) {
    currentChapterIndex--;
    loadChapter();
    audioPlayer.play();
  }
});

audioPlayer.addEventListener('ended', () => {
    // Automatically play the next chapter when one ends
    nextChapterBtn.click();
});

audioPlayer.addEventListener('play', () => playPauseBtn.textContent = '⏸️');
audioPlayer.addEventListener('pause', () => playPauseBtn.textContent = '▶️');

// 8. INITIAL PAGE LOAD (Slightly modified to include player init)
// ...
const authContainer = document.querySelector('#auth-container');
const mainContent = document.querySelector('#main-content');
const logoutButton = document.querySelector('#logout-button');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const addBookButton = document.querySelector('#add-book-button');
const bookInput = document.querySelector('#book-input');

async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    updateUI(session?.user);
    if (session?.user) {
        displayBooks();
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user);
    if (event === 'SIGNED_IN') {
        displayBooks();
    }
    if (event === 'SIGNED_OUT') {
        libraryGrid.innerHTML = '';
    }
});

function updateUI(user) {
    authContainer.classList.toggle('d-none', !!user);
    mainContent.classList.toggle('d-none', !user);
    logoutButton.classList.toggle('d-none', !user);
}
addBookButton.addEventListener('click', () => bookInput.click());
bookInput.addEventListener('change', async (e) => {
    // ... book import logic
});

checkSession();
