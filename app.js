// 1. SUPABASE SETUP
const SUPABASE_URL = 'https://emuydrvfmzkblwifyisv.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdXlkcnZmbXprYmx3aWZ5aXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MDA1NDgsImV4cCI6MjA3MTM3NjU0OH0.SzPdRdjJCNrXEg0rm-waP6puAOv8I45OR6DBOdSxGKs'; // Replace with your Anon Key

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. DOM ELEMENTS
const authContainer = document.querySelector('#auth-container');
const mainContent = document.querySelector('#main-content');
const logoutButton = document.querySelector('#logout-button');
const authForm = document.querySelector('#auth-form');
const authError = document.querySelector('#auth-error');
const addBookButton = document.querySelector('#add-book-button');
const bookInput = document.querySelector('#book-input');

// 3. AUTHENTICATION LOGIC
authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.classList.add('d-none');
  const email = event.target.email.value;
  const password = event.target.password.value;
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Sign in error:', error.message);
    authError.textContent = error.message;
    authError.classList.remove('d-none');
    return;
  }
  
  authForm.reset();
});

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// 4. UI STATE MANAGEMENT
function updateUI(user) {
  if (user) {
    authContainer.classList.add('d-none');
    mainContent.classList.remove('d-none');
    logoutButton.classList.remove('d-none');
  } else {
    authContainer.classList.remove('d-none');
    mainContent.classList.add('d-none');
    logoutButton.classList.add('d-none');
  }
}

// 5. BOOK IMPORTING
addBookButton.addEventListener('click', () => {
  bookInput.click();
});

bookInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // New unzipping logic starts here
  console.log(`Starting to process ${file.name}...`);
  
  try {
    const zip = await JSZip.loadAsync(file); // Load the ZIP file
    
    console.log("Files found inside the zip:");
    // Loop through each file in the zip and log its name
    zip.forEach((relativePath, zipEntry) => {
      console.log("- ", zipEntry.name);
    });

    alert("Successfully read the zip file! Check the console to see the file list.");

  } catch (error) {
    console.error("Error reading the zip file:", error);
    alert("Sorry, there was an error reading that zip file.");
  }
  
  // Reset the input so the user can select the same file again
  bookInput.value = '';
});


// 6. PAGE LOAD AND AUTH LISTENER
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user;
    updateUI(user);
}

checkSession();

supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user;
  updateUI(user);
});