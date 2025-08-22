// 1. SUPABASE SETUP
const SUPABASE_URL = 'https://emuydrvfmzkblwifyisv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdXlkcnZmbXprYmx3aWZ5aXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDA1NDgsImV4cCI6MjA3MTM3NjU0OH0.SzPdRdjJCNrXEg0rm-waP6puAOv8I45OR6DBOdSxGKs';
const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM ELEMENTS
const authContainer = document.querySelector('#auth-container');
const mainContent = document.querySelector('#main-content');
const logoutButton = document.querySelector('#logout-button');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const addBookButton = document.querySelector('#add-book-button');
const bookInput = document.querySelector('#book-input');
const libraryGrid = document.querySelector('#library-grid');

// 3. AUTHENTICATION & SESSION
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.classList.add('d-none');
  const { email, password } = e.target.elements;
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) {
    authError.textContent = error.message;
    authError.classList.remove('d-none');
  }
  authForm.reset();
});

logoutButton.addEventListener('click', () => supabase.auth.signOut());

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
    libraryGrid.innerHTML = ''; // Clear library on logout
  }
});

// 4. UI MANAGEMENT
function updateUI(user) {
  authContainer.classList.toggle('d-none', !!user);
  mainContent.classList.toggle('d-none', !user);
  logoutButton.classList.toggle('d-none', !user);
}

// 5. BOOK IMPORTING
addBookButton.addEventListener('click', () => bookInput.click());
bookInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  alert('Processing file... This may take a moment.');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to add a book.');

    const bookId = crypto.randomUUID();
    const zip = await JSZip.loadAsync(file);
    
    let coverFile = null;
    const audioFiles = [];

    // Find cover and audio files within the zip
    zip.forEach((relativePath, zipEntry) => {
      const fileName = zipEntry.name.toLowerCase();
      if (!coverFile && /\.(jpg|jpeg|png)$/i.test(fileName)) {
        coverFile = zipEntry;
      } else if (/\.(mp3|m4a|mp4|webm)$/i.test(fileName)) {
        audioFiles.push(zipEntry);
      }
    });

    if (!coverFile) throw new Error('No cover image found in the zip file.');

    // Store cover image in IndexedDB
    const coverBlob = await coverFile.async('blob');
    const coverKey = `cover-${bookId}`;
    await idbKeyval.set(coverKey, coverBlob);

    // Store audio files in IndexedDB
    const chapterKeys = [];
    for (const [index, audioFile] of audioFiles.entries()) {
      const audioBlob = await audioFile.async('blob');
      const chapterKey = `chapter-${bookId}-${index}`;
      await idbKeyval.set(chapterKey, audioBlob);
      chapterKeys.push(chapterKey);
    }

    // Save book metadata to Supabase
    const newBook = {
      // id: bookId, <-- THIS LINE IS REMOVED
      user_id: user.id,
      title: file.name.replace('.zip', ''),
      author: 'Unknown Author',
      cover_image_url: coverKey, // Storing the key, not a URL
      chapters: chapterKeys, // Storing an array of keys
    };

    const { error } = await supabase.from('books').insert(newBook);
    if (error) throw error;
    
    // Refresh the library display
    await displayBooks();
    alert('Book added successfully!');

  } catch (error) {
    console.error('Error adding book:', error);
    alert(`Error: ${error.message}`);
  } finally {
    bookInput.value = ''; // Reset file input
  }
});

// 6. LIBRARY DISPLAY
async function displayBooks() {
  libraryGrid.innerHTML = '<h2>Loading library...</h2>'; // Show loading state

  const { data: books, error } = await supabase.from('books').select('*');
  if (error) {
    console.error('Error fetching books:', error);
    libraryGrid.innerHTML = '<p class="text-danger">Could not load library.</p>';
    return;
  }

  if (books.length === 0) {
    libraryGrid.innerHTML = '<p>Your library is empty. Add a book to get started!</p>';
    return;
  }

  libraryGrid.innerHTML = ''; // Clear loading state
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

// Initial page load check
checkSession();