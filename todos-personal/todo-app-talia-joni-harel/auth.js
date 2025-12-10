// Import Firebase Authentication
import { auth } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Tab Switching
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;
    
    // Update tab buttons
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    
    // Update tab content
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${targetTab}-panel`).classList.add('active');
    
    // Clear error messages
    clearErrors();
  });
});

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Basic validation
  if (!email || !password) {
    showError(loginError, 'Please fill in all fields');
    return;
  }
  
  // Disable submit button
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  
  try {
    // Sign in with Firebase
    await signInWithEmailAndPassword(auth, email, password);
    // Redirect happens in onAuthStateChanged listener
  } catch (error) {
    console.error('Login error:', error);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Sign In</span><span aria-hidden="true">→</span>';
    
    // Show user-friendly error message
    let errorMessage = 'Failed to sign in. Please try again.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password.';
    }
    showError(loginError, errorMessage);
  }
});

// Register Form Handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors();
  
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerPasswordConfirm').value;
  
  // Validation
  if (!email || !password || !confirmPassword) {
    showError(registerError, 'Please fill in all fields');
    return;
  }
  
  if (password.length < 6) {
    showError(registerError, 'Password must be at least 6 characters');
    return;
  }
  
  if (password !== confirmPassword) {
    showError(registerError, 'Passwords do not match');
    return;
  }
  
  // Disable submit button
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  
  try {
    // Create user with Firebase
    await createUserWithEmailAndPassword(auth, email, password);
    // Redirect happens in onAuthStateChanged listener
  } catch (error) {
    console.error('Registration error:', error);
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Create Account</span><span aria-hidden="true">→</span>';
    
    // Show user-friendly error message
    let errorMessage = 'Failed to create account. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Use at least 6 characters.';
    }
    showError(registerError, errorMessage);
  }
});

// Helper Functions
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

function clearErrors() {
  loginError.classList.remove('show');
  registerError.classList.remove('show');
}

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, redirect to main app
    console.log('User authenticated, redirecting to app...');
    window.location.href = 'index.html';
  }
});

console.log('Auth page initialized');
