document.addEventListener("DOMContentLoaded", () => {
  let city = "Srinagar";
  const country = "India";
  const method = 2;  // ISNA method
  let lat, lon;
  
  const apiURL = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`;
  
  // Fetch prayer timings and update UI
  function fetchPrayerTimes(city) {
    fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`)
      .then(response => response.json())
      .then(data => {
        const timings = data.data.timings;
        const date = data.data.date;
        const hijri = date.hijri;
        const tableBody = document.getElementById("timings-table");
        
        // Update Hijri and Gregorian dates
        document.querySelector(".hijri").textContent = `${hijri.day} - ${hijri.month.ar} ${hijri.year}`;
        document.querySelector(".gregorian").textContent = `${date.gregorian.weekday.en} ${date.gregorian.date} ${date.gregorian.month.en} ${date.gregorian.year}`;
        
        // Clear existing table data
        tableBody.innerHTML = '';
        
        // Insert prayer timings into the table
        Object.entries(timings).forEach(([prayer, time]) => {
          const startTime = convertTo12HourFormat(time);
          
          const row = `
            <tr>
              <td>${prayer}</td>
              <td>${date.gregorian.date} ${date.gregorian.month.en} ${date.gregorian.year}</td>
              <td class="start">${startTime}</td>
            </tr>
          `;
          tableBody.innerHTML += row;
        });
        
        // Find the next prayer and set a countdown
        let nextPrayer = getNextPrayer(timings);
        const countdownElement = document.querySelector(".countdown");
        document.querySelector(".next-prayer").textContent = nextPrayer.name;
        
        // Start the countdown and update it in real-time
        const countdownInterval = setInterval(() => {
          const now = new Date();
          let [hours, minutes] = nextPrayer.time.split(':').map(Number);
          
          const prayerTime = new Date();
          prayerTime.setHours(hours, minutes, 0);
          const timeRemaining = prayerTime - now;
          
          if (timeRemaining <= 0) {
            nextPrayer = getNextPrayer(timings);
            document.querySelector(".next-prayer").textContent = nextPrayer.name;
          }
          
          // Update the countdown
          const remainingHours = Math.floor(timeRemaining / 1000 / 60 / 60);
          const remainingMinutes = Math.floor((timeRemaining / 1000 / 60) % 60);
          const remainingSeconds = Math.floor((timeRemaining / 1000) % 60);
          
          countdownElement.textContent = `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }, 1000);
      })
      .catch(error => {
        console.error("Error fetching Namaz timings:", error);
      });
  }
  
  // Fetch prayer times initially for Srinagar
  fetchPrayerTimes(city);
  
  // Handle location change
  document.querySelector('.district-select').addEventListener('change', (event) => {
    city = event.target.value;
    fetchPrayerTimes(city);  // Update prayer timings based on the selected district
  });
  
  // Function to get next prayer based on current time
  function getNextPrayer(timings) {
    const prayers = Object.keys(timings);
    const now = new Date();
    let nextPrayer = null;
    
    for (let i = 0; i < prayers.length; i++) {
      const prayerTime = new Date();
      const [hours, minutes] = timings[prayers[i]].split(':');
      prayerTime.setHours(hours, minutes, 0);
      
      if (now < prayerTime) {
        nextPrayer = { name: prayers[i], time: timings[prayers[i]] };
        break;
      }
    }
    
    if (!nextPrayer) {
      nextPrayer = { name: prayers[0], time: timings[prayers[0]] }; // If no prayer found, reset to the first prayer
    }
    
    return nextPrayer;
  }
  
  // Function to convert 24-hour time format to 12-hour format with AM/PM
  function convertTo12HourFormat(time) {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12; // Convert 0 (midnight) to 12
    return `${hour12}:${minutes} ${ampm}`;
  }
  
  // Function to calculate Qibla direction using user's latitude and longitude
  function getQiblaDirection(lat, lon) {
    const qiblaLat = 21.4225;  // Latitude of Kaaba, Mecca
    const qiblaLon = 39.8262;  // Longitude of Kaaba, Mecca
    
    // Calculate the bearing angle using the Haversine formula
    const deltaLon = Math.radians(qiblaLon - lon);
    const lat1 = Math.radians(lat);
    const lat2 = Math.radians(qiblaLat);
    
    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    
    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180 / Math.PI + 360) % 360;  // Normalize to 0-360 degrees
    
    document.getElementById('qibla-arrow').style.transform = `rotate(${bearing}deg)`;
    document.getElementById('qibla-degree').textContent = `Qibla Direction: ${Math.round(bearing)}°`;
  }
  
  // Helper function to convert degrees to radians
  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };
  
  // Get user's current position and show Qibla direction
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      lat = position.coords.latitude;
      lon = position.coords.longitude;
      getQiblaDirection(lat, lon);
    });
  }
});