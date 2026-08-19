// public/js/signup.js
document
  .querySelector(".form--signup")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;

    try {
      const response = await axios({
        method: "POST",
        url: "/api/v1/users/signup",
        data: { name, email, password, passwordConfirm },
        withCredentials: true,
      });

      if (response.data.status === "success") {
        showAlert("success", "Account created successfully!");
        window.setTimeout(() => {
          location.assign("/");
        }, 1500);
      }
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Signup failed");
    }
  });
