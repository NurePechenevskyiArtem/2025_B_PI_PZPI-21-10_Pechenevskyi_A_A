const API_BASE = "https://plant-backend-aqib.onrender.com";

// Вхід через бекенд
async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.error || "Помилка входу");
    return null;
  }

  localStorage.setItem("access_token", result.access_token);
  localStorage.setItem("user_id", result.user_id);
  alert("Успішний вхід!");
  window.location.href = "index.html";
  return result;
}

// Реєстрація через бекенд (з підтвердженням пошти)
async function registerUser() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Введи email і пароль");
    return;
  }

  const response = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();

  if (!response.ok) {
    alert(result.error || "Помилка реєстрації");
    return;
  }

  // Повідомлення користувачу
  alert("Реєстрація успішна! Підтвердь email перед входом.");
}


// Виклик при кліку на кнопку "Увійти"
async function signIn() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Введи email і пароль");
    return;
  }

  await loginUser(email, password);
}

// Отримання токену
function getAccessToken() {
  return localStorage.getItem("access_token");
}

// Отримання ID користувача
function getUserId() {
  return localStorage.getItem("user_id");
}

// Вийти
function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  alert("Вихід виконано");
}
