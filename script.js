const clockEl = document.getElementById("clock");
const countdownEl = document.getElementById("countdown");
const nextPrayerNameEl = document.getElementById("next-prayer-name");
const tableBody = document.getElementById("timings-table");
const hijriEl = document.getElementById("hijri");
const gregorianEl = document.getElementById("gregorian");

const locations = {
  Srinagar: { lat: 34.0837, lon: 74.7973 },
  Anantnag: { lat: 33.7294, lon: 75.1517 },
  Baramulla: { lat: 34.2090, lon: 74.3480 },
  Kupwara: { lat: 34.5300, lon: 74.2500 }
};

let timerInterval;

function updateClock() {
  const now = new Date();
  clockEl.textContent = "🕒 " + now.toLocaleTimeString("en-US", { hour12: true });
}

setInterval(updateClock, 1000);
updateClock();

function convertTo12Hour(time24) {
  let [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

async function fetchPrayerTimes(district) {
  const { lat, lon } = locations[district];
  const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  const timings = data.data.timings;
  const hijriDate = data.data.date.hijri;
  const gregorianDate = data.data.date.gregorian;

  hijriEl.textContent = `${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year}`;
  gregorianEl.textContent = `${gregorianDate.weekday.en} ${gregorianDate.date}`;

  updateTimingsTable(timings);
  startCountdown(timings);
}

function updateTimingsTable(timings) {
  const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  tableBody.innerHTML = "";

  prayerNames.forEach(prayer => {
    const time = convertTo12Hour(timings[prayer]);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${prayer}</td><td>${time}</td>`;
    tableBody.appendChild(tr);
  });
}

function startCountdown(timings) {
  clearInterval(timerInterval);

  const now = new Date();
  const prayerOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  let nextPrayer = null;
  let nextTime = null;

  for (let prayer of prayerOrder) {
    const timeStr = timings[prayer];
    const [hour, minute] = timeStr.split(":").map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hour, minute, 0, 0);
    if (now < prayerTime) {
      nextPrayer = prayer;
      nextTime = prayerTime;
      break;
    }
  }
  if (!nextPrayer) {
    nextPrayer = "Fajr";
    nextTime = new Date();
    nextTime.setDate(nextTime.getDate() + 1);
    const [hour, minute] = timings["Fajr"].split(":").map(Number);
    nextTime.setHours(hour, minute, 0, 0);
  }

  nextPrayerNameEl.textContent = "Next: " + nextPrayer;

  timerInterval = setInterval(() => {
    const now = new Date();
    const diff = nextTime - now;

    if (diff <= 0) {
      clearInterval(timerInterval);
      countdownEl.textContent = "00:00:00";
      return;
    }

    const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const mins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const secs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
    countdownEl.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

document.getElementById("district-select").addEventListener("change", () => {
  const selectedDistrict = document.getElementById("district-select").value;
  fetchPrayerTimes(selectedDistrict);
});

fetchPrayerTimes("Srinagar");

document.getElementById("qibla-btn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const api = `https://api.aladhan.com/v1/qibla/${lat}/${lon}`;
      const res = await fetch(api);
      const data = await res.json();
      const direction = data.data.direction;

      document.getElementById("qibla-direction").textContent = `Qibla: ${direction.toFixed(2)}°`;

      document.getElementById("compass").style.transform = `rotate(${direction}deg)`;

    }, () => {
      alert("Please enable location access to use Qibla Finder.");
    });
  } else {
    alert("Geolocation not supported by this browser.");
  }
});
