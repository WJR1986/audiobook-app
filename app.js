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

// 3. AUTHENTICATION LOGIC (Login Only)
authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.classList.add('d-none'); // Hide error on new submission
  const email = event.target.email.value;
  const password = event.target.password.value;
  
  // Try to sign in the user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    // If sign in fails, show an error
    console.error('Sign in error:', error.message);
    authError.textContent = error.message;
    authError.classList.remove('d-none');
    return;
  }
  
  console.log('User signed in:', data);
  authForm.reset();
});

// Logout functionality
logoutButton.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
  } else {
    console.log('User signed out');
  }
});

// 4. UI STATE MANAGEMENT
function updateUI(user) {
  if (user) {
    // User is logged in
    authContainer.classList.add('d-none');
    mainContent.classList.remove('d-none');
    logoutButton.classList.remove('d-none');
  } else {
    // User is logged out
    authContainer.classList.remove('d-none');
    mainContent.classList.add('d-none');
    logoutButton.classList.add('d-none');
  }
}

// 5. LISTEN FOR AUTH CHANGES
supabase.auth.onAuthStateChange((event, session) => {
  const user = session?.user;
  updateUI(user);
});