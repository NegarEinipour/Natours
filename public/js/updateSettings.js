// TYPE IS EITHER "password" OR "data"
const updateSettings = async (data, type) => {
  try {
    const url =
      type === "password"
        ? "/api/v1/users/updatePassword"
        : "/api/v1/users/updateMe";

    const response = await axios({
      method: "PATCH",
      url,
      data,
      withCredentials: true,
    });

    if (response.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully!`);
    }

    // Update image preview (for data updates only)
    if (type === "data" && response.data.data.user.photo) {
      const newPhoto = response.data.data.user.photo;
      const timestamp = Date.now();

      const userPhoto = document.querySelector(".form__user-photo");
      if (userPhoto) {
        userPhoto.src = `/img/users/${newPhoto}?t=${timestamp}`;
      }

      const navUserImg = document.querySelector(".nav__user-img");
      if (navUserImg) {
        navUserImg.src = `/img/users/${newPhoto}?t=${timestamp}`;
      }
    }
  } catch (err) {
    const message = err.response?.data?.message || "Update failed.";
    showAlert("error", message);
  }
};

// IMAGE PREVIEW
document.addEventListener("DOMContentLoaded", function () {
  const photoInput = document.getElementById("photo");
  const userPhoto = document.querySelector(".form__user-photo");

  if (photoInput) {
    photoInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          if (userPhoto) {
            userPhoto.src = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

// USER DATA FORM
document.addEventListener("DOMContentLoaded", function () {
  const userDataForm = document.querySelector(".form-user-data");
  const photoInput = document.getElementById("photo");

  if (userDataForm) {
    userDataForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const form = new FormData();
      form.append("name", document.getElementById("name").value);
      form.append("email", document.getElementById("email").value);

      if (photoInput && photoInput.files[0]) {
        form.append("photo", photoInput.files[0]);
      }

      await updateSettings(form, "data");
    });
  }
});

// PASSWORD FORM
document.addEventListener("DOMContentLoaded", function () {
  const userPasswordForm = document.querySelector(".form-user-password");

  if (userPasswordForm) {
    userPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const btn = document.querySelector(".btn--save-password");
      if (btn) btn.textContent = "updating...";

      const passwordCurrent = document.getElementById("password-current").value;
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("password-confirm").value;

      await updateSettings(
        { passwordCurrent, password, passwordConfirm },
        "password",
      );

      if (btn) btn.textContent = "Save password";

      document.getElementById("password-current").value = "";
      document.getElementById("password").value = "";
      document.getElementById("password-confirm").value = "";
    });
  }
});
