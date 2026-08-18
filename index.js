require("@babel/polyfill");
var $kcgDd$axios = require("axios");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}


const $399ca7fcf5541152$export$516836c6a9dfc573 = ()=>{
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
};
const $399ca7fcf5541152$export$de026b00723010c1 = (type, msg)=>{
    $399ca7fcf5541152$export$516836c6a9dfc573();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout($399ca7fcf5541152$export$516836c6a9dfc573, 5000);
};


const $119aca91ee01e60c$export$596d806903d1f59e = async (email, password)=>{
    console.log("\uD83D\uDCE7 Sending email:", email);
    console.log("\uD83D\uDD11 Sending password:", password);
    try {
        const response = await (0, ($parcel$interopDefault($kcgDd$axios)))({
            method: "POST",
            url: "/api/v1/users/login",
            data: {
                email: email,
                password: password
            },
            withCredentials: true
        });
        if (response.data.status === "success") {
            (0, $399ca7fcf5541152$export$de026b00723010c1)("success", " Logged in successfully!");
            setTimeout(()=>{
                location.assign("/");
            }, 1500);
        }
    } catch (error) {
        console.error("error", error.response);
        const message = error.response?.data?.message || "Login failed.";
        (0, $399ca7fcf5541152$export$de026b00723010c1)("\u274C " + message);
    }
};


console.log("\u2705 index.js loaded!");
document.addEventListener("DOMContentLoaded", function() {
    console.log("\u2705 DOM loaded!");
    const form = document.querySelector(".form");
    console.log("\uD83D\uDD0D Form:", form);
    if (form) form.addEventListener("submit", function(e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        console.log("\uD83D\uDCE7 Email:", email);
        console.log("\uD83D\uDD11 Password:", password);
        (0, $119aca91ee01e60c$export$596d806903d1f59e)(email, password);
    });
    else console.error("\u274C Form not found!");
});


//# sourceMappingURL=index.js.map
