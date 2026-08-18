// const updateData = async (name, email) => {
//   try {
//     const response = await axios({
//       method: "PATCH",
//       url: "/api/v1/users/updateMe",
//       data: { name, email },
//       withCredentials: true,
//     });

//     // console.log("Full response:", response);

//     if (response.data.status === "success") {
//       showAlert("success", "Data updated successfully!");
//     }
//   } catch (err) {
//     // console.log("Error response:", err.response);
//     const message = err.response?.data?.message || "Update failed.";
//     showAlert("error", `${message}`);
//   }
// };

//TYPE IS EITHER PASSWORD OR DATA
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

    // console.log("Full response:", response);

    if (response.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully!`);
    }

    // UPDATE THE IMAGE WITHOUT RELOADING!
    //  UPDATE BOTH IMAGES!
    if (type === "data" && response.data.data.user.photo) {
      const newPhoto = response.data.data.user.photo;
      const timestamp = Date.now();

      // 1 Update the account page image
      const userPhoto = document.querySelector(".form__user-photo");
      if (userPhoto) {
        userPhoto.src = `/img/users/${newPhoto}?t=${timestamp}`;
      }

      // 2 Update the header image
      const navUserImg = document.querySelector(".nav__user-img");
      if (navUserImg) {
        navUserImg.src = `/img/users/${newPhoto}?t=${timestamp}`;
      }
    }
  } catch (err) {
    // console.log("Error response:", err.response);
    const message = err.response?.data?.message || "Update failed.";
    showAlert("error", `${message}`);
  }
};

// document.addEventListener("DOMContentLoaded", function () {
//   const userDataForm = document.querySelector(".form-user-data");

//   if (userDataForm) {
//     userDataForm.addEventListener("submit", function (e) {
//       e.preventDefault();
//       const form = new FormData();
//       form.append("name", document.getElementById("name").value);
//       form.append("email", document.getElementById("email").value);
//       // form.append("photo", document.getElementById("photo").files[0]);

//       const photoInput = document.getElementById("photo");
//       if (photoInput && photoInput.files[0]) {
//         form.append("photo", photoInput.files[0]);
//       }

//       updateSettings(form, "data");
//     });
//   }
// });

document.addEventListener("DOMContentLoaded", function () {
  const userDataForm = document.querySelector(".form-user-data");
  const photoInput = document.getElementById("photo");
  const userPhoto = document.querySelector(".form__user-photo");
  const navUserImg = document.querySelector(".nav__user-img");

  //  PREVIEW IMAGE WHEN SELECTED
  if (photoInput) {
    photoInput.addEventListener("change", function (e) {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          // Update both images with the preview
          if (userPhoto) {
            userPhoto.src = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  //  SUBMIT FORM
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

document.addEventListener("DOMContentLoaded", function () {
  const userPasswordForm = document.querySelector(".form-user-password");

  if (userPasswordForm) {
    userPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      document.querySelector(".btn--save-password").textContent = "updating...";

      const passwordCurrent = document.getElementById("password-current").value;
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("password-confirm").value;
      //   updateData(name, email);
      await updateSettings(
        { passwordCurrent, password, passwordConfirm },
        "password",
      );
      document.querySelector(".btn--save-password").textContent =
        "update passwords";
      document.getElementById("password-current").value = "";
      document.getElementById("password").value = "";
      document.getElementById("password-confirm").value = "";
    });
  }
});
