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

bookInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  console.log('Selected file:', file.name);
  alert(`You selected the file: ${file.name}`);
});

// 6. PAGE LOAD AND AUTH LISTENER
// This new function checks for an existing session when the page loads
async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user;
    updateUI(user);
}

// Run the check when the script loads
checkSession();

// Listen for future auth changes
supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user;
  updateUI(user);
});