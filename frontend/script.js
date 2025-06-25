const API_BASE = "https://plant-backend-aqib.onrender.com";

// Отримання токену і user_id
function getAccessToken() {
  return localStorage.getItem("access_token");
}
function getUserId() {
  return localStorage.getItem("user_id");
}
function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  alert("Вихід виконано");
  updateAuthStatus();
}

// DOM
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("identify-btn")?.addEventListener("click", startIdentification);
  document.getElementById("refresh-btn")?.addEventListener("click", loadMyResults);
  updateAuthStatus();
});

// Конвертація зображення
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });
}

// Розпізнавання і збереження
async function startIdentification() {
  const file = document.getElementById("plant-image").files[0];
  if (!file) return alert("Оберіть зображення.");

  const access_token = getAccessToken();
  if (!access_token) return alert("Спочатку увійди в акаунт.");

  const base64Image = await toBase64(file);

  const response = await fetch(`${API_BASE}/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64Image })
  });

  const data = await response.json();
  const bestGuess = data?.suggestions?.[0]?.plant_name ?? "Невідомо";

  const saveResponse = await fetch(`${API_BASE}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token,
      plant_name: bestGuess,
      image_url: "" // можна зберігати базу64 або лінк
    })
  });

  const saveResult = await saveResponse.json();

  if (saveResult.success) {
    alert(`Рослина визначена: ${bestGuess}`);
  } else {
    console.error(saveResult.error);
    alert("Не вдалося зберегти.");
  }
}

// Завантажити результати з бекенду
async function loadMyResults() {
  const access_token = getAccessToken();
  if (!access_token) return alert("Спочатку увійди в акаунт.");

  const response = await fetch(`${API_BASE}/my-plants`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${access_token}`
    }
  });

  const data = await response.json();
  const list = document.getElementById("my-results");
  list.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    list.innerHTML = "<li>Немає збережених рослин.</li>";
    return;
  }

  data.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.plant_name} (${new Date(item.created_at).toLocaleString()})`;
    list.appendChild(li);
  });
}

// Статус авторизації
function updateAuthStatus() {
  const access_token = getAccessToken();
  const status = document.getElementById("auth-status");
  const authBtn = document.getElementById("auth-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (!status || !authBtn || !logoutBtn) return;

  if (!access_token) {
    status.textContent = "🔒 Не авторизовано";
    authBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    authBtn.onclick = () => window.location.href = "auth.html";
    return;
  }

  fetch(`${API_BASE}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data.email) {
        status.textContent = `✅ Увійшов як: ${data.email}`;
        logoutBtn.style.display = "inline-block";
        authBtn.style.display = "none";
        logoutBtn.onclick = () => {
          logoutUser();
        };
      } else {
        throw new Error("Unauthorized");
      }
    })
    .catch(err => {
      console.error("Помилка перевірки:", err);
      status.textContent = "🔒 Сесія недійсна";
      authBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
    });
}
