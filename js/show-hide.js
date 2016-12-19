function Show1() {
document.getElementById("user1-msgs").style.display = "block";
}
function Hide1() {
document.getElementById("user1-msgs").style.display = "none";
}

function Show2() {
document.getElementById("user2-msgs").style.display = "block";
}
function Hide2() {
document.getElementById("user2-msgs").style.display = "none";
}

function Show3() {
document.getElementById("user3-msgs").style.display = "block";
}
function Hide3() {
document.getElementById("user3-msgs").style.display = "none";
}

document.getElementById("show-user1").addEventListener("click", Show1, false);
document.getElementById("show-user2").addEventListener("click", Show2, false);
document.getElementById("show-user3").addEventListener("click", Show3, false);

document.getElementById("hide-user1").addEventListener("click", Hide1, false);
document.getElementById("hide-user2").addEventListener("click", Hide2, false);
document.getElementById("hide-user3").addEventListener("click", Hide3, false);
