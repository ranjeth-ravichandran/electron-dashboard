const { ipcRenderer, app } = require('electron');
const Chart = require("chart.js/auto"); // Have to use require as project is using CommonJS not ES modules.

// Testing Layout
const titleBarTitle = document.getElementById('titlebar-title');
const contentArea = document.querySelector('.main-container');
const testPageLink = document.getElementById('test-page');
const dashboardPageLink = document.getElementById('dashboard-page');
const settingsPageLink = document.getElementById('settings');

let currentPage = 'foundation';
let isDarkMode = false; // Example state

let locationOfPlace = "London"; // Location used for Weather and Time
let startDate;
let endDate;

function loadPage(pageName) {
  if (pageName === currentPage) return;

  currentPage = pageName;
  fetch(`${pageName}.html`)
      .then(response => response.text())
      .then(html => {
          contentArea.innerHTML = html;

          if (pageName === 'dashboard') {
              initializeDashboard();
          } else if (pageName === 'test') {
              initializeTestPage();
          } else if (pageName === 'settings') {
              initializeSettingsPage();
          }
      });
}

document.getElementById('close').addEventListener('click', () => {
  ipcRenderer.send('close-app');
});

document.getElementById('minimise').addEventListener('click', () => {
ipcRenderer.send('minimise-app');
});

function updateDates() {
  startDate = document.getElementById("start-date").value;
  endDate = document.getElementById("end-date").value;

  loadWeeklyWeather();
}

async function loadWeeklyWeather() {
  // London Co-ord
  const lat = 51.5085;
  const lon = -0.1257;
  const weatherData = await ipcRenderer.invoke('fetch-weekly-weather', lat, lon, startDate, endDate);

  const weatherDataContainter = document.getElementById("weather-data");
  weatherDataContainter.innerHTML = '';
  weatherDataContainter.addEventListener('wheel', (event) => {
    event.preventDefault();
    weatherDataContainter.scrollLeft += event.deltaY + 10;
  });
  for (let i = 0; i < weatherData.time.length; i++) {
    let weatherDayHTML = document.createElement('div');
    weatherDayHTML.setAttribute('class', 'weather-day')
    weatherDayHTML.innerHTML = `
      <p class="date-text">${weatherData.time[i]}</p>
      <p>Status: ${weatherData.weather_code[i]}</p>
      <p>Min Temp: ${weatherData.temperature_2m_min[i]}°C</p>
      <p>Max Temp: ${weatherData.temperature_2m_max[i]}°C</p>
    `
    weatherDayHTML.addEventListener('click', function() {
      const dateElement = this.querySelector('.date-text');
      const dateValue = dateElement.textContent;
      selectiveHourlyWeather(dateValue);
    });

    weatherDataContainter.appendChild(weatherDayHTML); 
  }

}

async function selectiveHourlyWeather(date) {
  const lat = 51.5085;
  const lon = -0.1257;

  const weatherData = await ipcRenderer.invoke('fetch-hourly-weather', lat, lon, date);

  const timeLabels = weatherData.hourly.time.map(timeStr => timeStr.split('T')[1]);
  const temperatureData = weatherData.hourly.temperature_2m;

  if (!document.querySelector('.weekly-weather canvas')) {
    const weatherDayCanvas = document.createElement('canvas'); // Correct: createElement()
    weatherDayCanvas.id = "canvas2"; // Set the ID
    weatherDayCanvas.style.width = "inherit"; // Set the width
    weatherDayCanvas.style.height = "400px"; // Set the height

    document.querySelector('.weekly-weather').appendChild(weatherDayCanvas);
  }

  // Chart.js integration
  let canvas = document.getElementById('canvas2');

  let existingChart = Chart.getChart(canvas); // Get existing chart instance
  if (existingChart) {
      existingChart.destroy(); // Destroy the previous chart
  }

  new Chart(canvas, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [{
        label: "Temperature (°C)",
        data: temperatureData,
        borderColor: "rgb(0, 0, 0)",
        backgroundColor: "rgb(134, 255, 148)",
        borderWidth: 2,
        pointRadius: 5,
        tension: 0.35
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Hourly Temperature for ${date}`
        }
      }
    }
  });
}

function switchMode() {
  isDarkMode = !isDarkMode;
  const body = document.querySelector('body');
  const switchModeImg = document.getElementById('switch-mode');

  body.style.backgroundColor = isDarkMode ? 'rgb(30, 29, 33)' : 'white';
  body.style.color = isDarkMode ? 'white' : 'black';
  switchModeImg.src = isDarkMode ? '../public/moon.svg' : '../public/sun.svg';

  document.getElementById('darkmode-info').innerText = `Dark Mode: ${isDarkMode}`;
}

function initializeTestPage() {
  titleBarTitle.textContent = "Test"
  const modeSwitch = document.getElementById("switch-mode");
  if (modeSwitch) {
      modeSwitch.addEventListener("click", switchMode);
  }
}

function initializeSettingsPage() {
  titleBarTitle.textContent = "Settings"
  const modeSwitch = document.getElementById("switch-mode");
  if (modeSwitch) {
      modeSwitch.addEventListener("click", switchMode);
  }

  document.getElementById('settings-data').innerHTML = `<p>Current Page: ${currentPage}</p>`;
  document.getElementById('darkmode-info').innerText = `Dark Mode: ${isDarkMode}`;
  document.getElementById('location').innerText = `Location: ${locationOfPlace}`;
}


function initializeDashboard() {
  titleBarTitle.textContent = "Dashboard"
  const modeSwitch = document.getElementById("switch-mode");
  if (modeSwitch) {
      modeSwitch.addEventListener("click", switchMode);
  }

  // Displaying Date and Time
  function updateTime() {
    const now = new Date();

    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let dateShort = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`

    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const dayOfWeek = weekday[now.getDay()];

    let dayOfMonth = () => {
      let append;
      if (day > 3 && day < 21) {
        append = "th";
      } else {
        switch (day%10) {
          case 1:
            append = "st"
            break;
          case 2:
            append = "nd"
            break;
          case 3:
            append = "rd"
            break;
          default:
            append = "th"
            break;
        }
      }
      return `${day}${append}`;
    }

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthOfYear = months[now.getMonth()];

    let dateLong =`${dayOfWeek} ${dayOfMonth()} ${monthOfYear} ${year}` 

    // Time
    // The line .toString().padStart(2, '0') Ensures the time starts with 0;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    let time = `${hours}:${minutes}:${seconds}`;

    let currentDateTime = `${dateShort}\n${dateLong}\n${time}`

    document.querySelector('.date-time').innerText = currentDateTime;
  }

  updateTime();
  setInterval(updateTime, 1000);

  //Qutoes
  async function loadQuote() {
    const quoteData = await ipcRenderer.invoke('fetch-quote');
    document.getElementById('quote').innerText = `"${quoteData.q}"`;
    document.getElementById('author').innerText = `— ${quoteData.a}`;
  }

  document.querySelector('.quotes').addEventListener('click', () => {
    loadQuote();  // Fetch new quote
  });

  //Weather
  async function loadWeather() {
    // London Co-ord
    const lat = 51.5085;
    const lon = -0.1257;
    const weatherData = await ipcRenderer.invoke('fetch-weather', lat, lon);
    
    if (weatherData.error) {
      document.querySelector('.weather').innerText = "Error fetching weather data";
    } else {

      function weatherCodes(weatherCode, type) {
        switch (weatherCode) {
          case 0:
            return (type == 0) ? "Clear Sky" : "../public/clear-sky.svg"; 
          case 1: 
            return "Mainly Clear"
          case 2: 
            return (type == 0) ? "Partly Cloudy" : "../public/overcast.svg"; 
          case 3:
            return (type == 0) ? "Overcast" : "../public/overcast.svg"; 
          case 45:
            return "Fog" 
          case 48:
            return "Rime Fog" 
          case 51:
            return (type == 0) ? "Light Drizzle" : "../public/rain.svg"; 
          case 53:
            return (type == 0) ? "Moderate Drizzle" : "../public/rain.svg"; 
          case 55:
            return (type == 0) ? "Dense Drizzle" : "../public/rain.svg"; 
          case 56:
            return "Freezing Drizzle Light" 
          case 57:
            return "Freezing Drizzle Dense" 
          case 61:
            return (type == 0) ? "Slight Rain" : "../public/rain.svg"; 
          case 63:
            return (type == 0) ? "Moderate Rain" : "../public/rain.svg"; 
          case 65:
            return (type == 0) ? "Heavy Rain" : "../public/rain.svg"; 
          case 66:
            return "Freezing Light Rain" 
          case 67:
            return "Freezing Heavy Rain" 
          case 71:
            return "Slight Snow Fall" 
          case 73:
            return "Moderate Snow Fall" 
          case 75:
            return "Heavy Snow Fall" 
          case 77:
            return "Snow Grains" 
          case 80:
            return "Slight Rain Showers" 
          case 81:
            return "Moderate Rain Showers" 
          case 82:
            return "Violent Rain Showers" 
          case 85:
            return "Slight Snow Showers" 
          case 86:
            return "Heavy Snow Showers" 
          case 95:
            return "Thunderstorm" 
          case 96:
            return "Thunderstorm with Slight Hail" 
          case 99:
            return "Thunderstorm with Heavy Hail"
          default:
            return "Error."   
        }
      }

        document.querySelector('.weather').innerHTML = `
            <img id="weather-image" src=${weatherCodes(weatherData.current.weather_code, 1)} alt=${weatherCodes(weatherData.current.weather_code, 0)}>
            <p>Weather: ${weatherCodes(weatherData.current.weather_code, 0)}</p>
            <p>Temperature: ${weatherData.current.temperature_2m}°C</p>
            <p>Humidity: ${weatherData.current.relative_humidity_2m}%</p>
            <p>Dew Point: ${weatherData.current.dew_point_2m}°C</p>
            <p>Wind Speed: ${weatherData.current.wind_speed_10m} km/h</p>
        `;
    }
  }
  loadWeather();
  setInterval(loadWeather, 60000);

  async function hourlyWeather() {
    const lat = 51.5085;
    const lon = -0.1257;

    const now = new Date();
    const date = now.toISOString().split('T')[0];

    const weatherData = await ipcRenderer.invoke('fetch-hourly-weather', lat, lon, date);

    const timeLabels = weatherData.hourly.time.map(timeStr => timeStr.split('T')[1]);
    const temperatureData = weatherData.hourly.temperature_2m;

    // Chart.js integration
    const canvas = document.getElementById('canvas');

    new Chart(canvas, {
      type: "line",
      data: {
        labels: timeLabels,
        datasets: [{
          label: "Temperature (°C)",
          data: temperatureData,
          borderColor: "rgb(0, 0, 0)",
          backgroundColor: "rgb(134, 255, 148)",
          borderWidth: 2,
          pointRadius: 5,
          tension: 0.35
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Hourly Temperature for Current Day'
          }
        }
      }
    });
  }

  hourlyWeather();

  //Images
  document.querySelector(".images").addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
        const imagePath = await ipcRenderer.invoke('fetch-image');

        const timestamp = Date.now();
        const imageUrlWithCacheBust = `${imagePath}?t=${timestamp}`;

        document.getElementById("random-image").src = imageUrlWithCacheBust;
    } catch (error) {
        console.error("Error in renderer:", error);
        document.getElementById("random-image").src = '';
        alert("Error fetching image. Please check the console for details.");
    }
  });
}

settingsPageLink.addEventListener('click', () => loadPage('settings'));
testPageLink.addEventListener('click', () => loadPage('test'));
dashboardPageLink.addEventListener('click', () => loadPage('dashboard'));







