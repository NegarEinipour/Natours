// public/js/signup.js

document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.querySelector(".form--signup");
  const signupBtn = document.getElementById("signup-btn");

  if (signupForm) {
    signupForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const originalText = signupBtn.textContent;
      signupBtn.textContent = "Processing...";
      signupBtn.disabled = true;

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
          setTimeout(() => {
            location.assign("/");
          }, 1500);
        }
      } catch (error) {
        console.error("❌ Error:", error.response?.data || error.message);
        signupBtn.textContent = originalText;
        signupBtn.disabled = false;
        showAlert("error", error.response?.data?.message || "Signup failed");
      }
    });
  } else {
    console.error("❌ Form NOT found!");
  }
});
