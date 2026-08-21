// LOGIN FUNCTION
const login = async (email, password) => {
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
    const message = error.response?.data?.message || "Login failed.";
    showAlert("error", message);
  }
};

// LOGOUT FUNCTION
const logout = async () => {
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
    showAlert("error", "Logout failed!");
  }
};

// DOM EVENTS
document.addEventListener("DOMContentLoaded", function () {
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
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      logout();
    });
  }
});
