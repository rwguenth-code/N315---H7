import { routes } from "./routes.js";
import {
  auth,
  createUserWithEmailAndPassword,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "./firebase.js";

const pageContent = document.querySelector("#page-content");
const routeLinks = document.querySelectorAll("[data-route]");
let activeRequest;

function updateAuthNavigation(user) {
  document.querySelectorAll('[data-auth="signed-out"]').forEach((element) => {
    element.hidden = Boolean(user);
  });
  document.querySelectorAll('[data-auth="signed-in"]').forEach((element) => {
    element.hidden = !user;
  });

  const greeting = document.querySelector("[data-user-name]");
  if (greeting) {
    greeting.textContent = user ? `Hi, ${user.displayName || user.email}` : "";
    greeting.hidden = !user;
  }
}

function showAuthStatus(message) {
  const status = document.querySelector("#auth-status");
  status.textContent = message;
  status.hidden = !message;
}

function getFormMessage(form) {
  let message = form.querySelector("[data-form-message]");
  if (!message) {
    message = document.createElement("p");
    message.dataset.formMessage = "";
    message.setAttribute("role", "alert");
    form.append(message);
  }
  return message;
}

function getAuthErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email. Try logging in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is disabled. Enable it in Firebase Authentication settings.";
    case "auth/too-many-requests":
      return "There have been too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Could not reach Firebase. Check your internet connection and try again.";
    case "auth/unauthorized-domain":
      return "This site's domain is not authorized in your Firebase Authentication settings.";
    default:
      console.error("Firebase authentication failed.", error);
      return "Authentication failed. Please try again.";
  }
}

async function renderRoute() {
  const requestedRoute = window.location.hash.slice(1) || "home";
  const route = routes[requestedRoute];

  if (!route) {
    window.location.hash = "home";
    return;
  }

  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;

  try {
    const response = await fetch(route.file, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Could not load ${route.file} (${response.status}).`);
    }

    pageContent.innerHTML = await response.text();
    document.body.dataset.page = requestedRoute;
    document.title = route.title;
    routeLinks.forEach((link) => {
      if (link.dataset.route === requestedRoute) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (window.location.hash) {
      pageContent.focus({ preventScroll: true });
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error("Unable to render the requested page.", error);
    pageContent.innerHTML = `
      <section class="page-error" role="alert">
        <h1>This page could not be loaded.</h1>
        <p>Please refresh the page or return to <a href="#home">Home</a>.</p>
      </section>
    `;
  }
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest(".login-form, .signup-form");
  if (!form) {
    return;
  }

  event.preventDefault();
  const message = getFormMessage(form);
  message.textContent = "";
  showAuthStatus("");

  if (!isFirebaseConfigured || !auth) {
    message.textContent = "Firebase is not configured yet. Add your Firebase web app settings to js/firebase.js, then try again.";
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const password = formData.get("password");

    if (form.matches(".signup-form")) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = `${formData.get("firstName").trim()} ${formData.get("lastName").trim()}`;
      let successMessage = "You're signed in.";
      try {
        await updateProfile(credential.user, { displayName });
      } catch (error) {
        console.error("The account was created, but its display name could not be saved.", error);
        successMessage = "Your account was created, but your name could not be saved. You're signed in.";
      }
      updateAuthNavigation(credential.user);
      showAuthStatus(successMessage);
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      updateAuthNavigation(credential.user);
      showAuthStatus("You're signed in.");
    }

    window.location.hash = "home";
  } catch (error) {
    message.textContent = getAuthErrorMessage(error);
  } finally {
    submitButton.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  if (!event.target.closest('[data-auth="signed-in"]')) {
    return;
  }

  try {
    await signOut(auth);
    showAuthStatus("You’re signed out.");
  } catch (error) {
    console.error("Firebase sign-out failed.", error);
    showAuthStatus("Could not sign out. Please try again.");
  }
});

if (auth) {
  onAuthStateChanged(
    auth,
    (user) => {
      updateAuthNavigation(user);
    },
    (error) => {
      console.error("Could not read Firebase authentication state.", error);
      showAuthStatus("Could not verify your sign-in status. Please refresh the page.");
    },
  );
} else {
  updateAuthNavigation(null);
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
