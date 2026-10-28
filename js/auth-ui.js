/**
 * Arcadia — Auth UI (homepage only)
 * Wires the navbar Log In button + avatar and the login/sign-up modal
 * to window.Arcadia (js/arcadia-cloud.js). Purely presentational —
 * all real auth logic lives in arcadia-cloud.js.
 */
(function () {
  "use strict";

  var loginBtn = document.getElementById("login-btn");
  var navAvatar = document.getElementById("nav-avatar");
  var modal = document.getElementById("auth-modal");
  var closeBtn = document.getElementById("auth-modal-close");
  var backdrop = document.getElementById("auth-modal-backdrop");
  var tabs = document.querySelectorAll("[data-auth-tab]");
  var loginForm = document.getElementById("auth-form-login");
  var signupForm = document.getElementById("auth-form-signup");
  var loginError = document.getElementById("login-error");
  var signupError = document.getElementById("signup-error");

  if (!modal || !window.Arcadia) return;

  function openModal(tab) {
    if (!Arcadia.isConfigured) {
      window.ArcadiaToast && ArcadiaToast("Cloud login isn't set up yet — see FIREBASE_SETUP.md");
      return;
    }
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    switchTab(tab || "login");
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    loginError.textContent = "";
    signupError.textContent = "";
  }
  function switchTab(tab) {
    tabs.forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-auth-tab") === tab); });
    loginForm.hidden = tab !== "login";
    signupForm.hidden = tab !== "signup";
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { switchTab(t.getAttribute("data-auth-tab")); });
  });
  closeBtn && closeBtn.addEventListener("click", closeModal);
  backdrop && backdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  loginBtn && loginBtn.addEventListener("click", function (e) {
    e.preventDefault();
    openModal("login");
  });

  loginForm && loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.textContent = "";
    var email = document.getElementById("login-email").value.trim();
    var password = document.getElementById("login-password").value;
    Arcadia.signIn(email, password)
      .then(function () {
        closeModal();
        window.ArcadiaToast && ArcadiaToast("Welcome back!");
      })
      .catch(function (err) {
        loginError.textContent = friendlyAuthError(err);
      });
  });

  signupForm && signupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    signupError.textContent = "";
    var name = document.getElementById("signup-name").value.trim();
    var email = document.getElementById("signup-email").value.trim();
    var password = document.getElementById("signup-password").value;
    if (!name) {
      signupError.textContent = "Pick a display name.";
      return;
    }
    Arcadia.signUp(email, password, name)
      .then(function () {
        closeModal();
        window.ArcadiaToast && ArcadiaToast("Account created — welcome to Arcadia!");
      })
      .catch(function (err) {
        signupError.textContent = friendlyAuthError(err);
      });
  });

  function friendlyAuthError(err) {
    var code = err && err.code;
    switch (code) {
      case "auth/email-already-in-use": return "That email already has an account — try logging in.";
      case "auth/invalid-email": return "That email address doesn't look right.";
      case "auth/weak-password": return "Password should be at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return "Email or password is incorrect.";
      case "auth/too-many-requests": return "Too many attempts — try again in a bit.";
      default: return (err && err.message) || "Something went wrong. Please try again.";
    }
  }

  if (navAvatar && !navAvatar.getAttribute("data-profile-wired")) {
    navAvatar.setAttribute("data-profile-wired", "true");
    navAvatar.addEventListener("click", function (e) {
      e.preventDefault();
      if (window.ArcadiaProfile && typeof window.ArcadiaProfile.open === "function") {
        window.ArcadiaProfile.open();
        return;
      }
      var user = Arcadia.getCurrentUser();
      if (!user) {
        openModal("login");
        return;
      }
      if (confirm("Log out of Arcadia?")) {
        Arcadia.signOutUser().then(function () {
          window.ArcadiaToast && ArcadiaToast("Logged out");
        });
      }
    });
  }

  Arcadia.onAuthChange(function (user) {
    if (user) {
      var initial = (user.displayName || user.email || "P").trim().charAt(0).toUpperCase();
      navAvatar.textContent = initial;
      navAvatar.title = (user.displayName || user.email) + " — Player Profile";
      navAvatar.classList.add("signed-in");
      loginBtn.textContent = "Log Out";
      loginBtn.onclick = function (e) {
        e.preventDefault();
        if (confirm("Log out of Arcadia?")) {
          Arcadia.signOutUser().then(function () {
            window.ArcadiaToast && ArcadiaToast("Logged out");
          });
        }
      };
    } else {
      navAvatar.textContent = "G";
      navAvatar.title = "Player Profile (Guest)";
      navAvatar.classList.remove("signed-in");
      loginBtn.textContent = "Log In";
      loginBtn.onclick = function (e) {
        e.preventDefault();
        openModal("login");
      };
    }
    if (typeof window.renderArcadiaLeaderboard === "function") {
      window.renderArcadiaLeaderboard();
    }
    if (window.ArcadiaProfile && typeof window.ArcadiaProfile.render === "function") {
      window.ArcadiaProfile.render();
    }
  });
})();
