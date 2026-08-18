// public/js/login.js
// console.log("login.js loaded!");

// Login function
const login = async (email, password) => {
  console.log("📧 Sending email:", email);
  console.log("🔑 Sending password:", password);

  try {
    const response = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: { email, password },
      withCredentials: true,
    });

    if (response.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (error) {
    // console.error("❌ Login error:", error.response);
    const message = error.response?.data?.message || "Login failed.";
    showAlert("error", `${message}`);
  }
};

// Logout function
const logout = async () => {
  console.log("🔍 Logout called!");

  try {
    const response = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
      withCredentials: true,
    });

    if (response.data.status === "success") {
      showAlert("success", "Logged out successfully!");
      setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (error) {
    // console.error("❌ Logout error:", error);
    showAlert("error", "Logout failed!");
  }
};

// DOM events
document.addEventListener("DOMContentLoaded", function () {
  // console.log("DOM loaded!");

  // Login form
  const form = document.querySelector(".form--login");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      login(email, password);
    });
  }

  // Logout button
  const logoutBtn = document.querySelector(".nav__el--logout");
  console.log("🔍 Logout button:", logoutBtn);
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // console.log("Logout clicked!");
      logout();
    });
  }
});
