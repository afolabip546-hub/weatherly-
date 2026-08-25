// =====================================
// WEATHERLY
// Live Weather + Search + GPS
// 3-Day Forecast + Sunrise/Sunset
// Saved Location + Notifications
// =====================================


// =====================================
// HTML ELEMENTS
// =====================================

const searchInput =
  document.querySelector(".search-box input");

const searchButton =
  document.querySelector("#searchButton");

const locationButton =
  document.querySelector("#locationButton");

const locationText =
  document.querySelector(".location");

const weatherIcon =
  document.querySelector(".weather-icon");

const temperatureText =
  document.querySelector(".current-weather h2");

const conditionText =
  document.querySelector(".condition");

const notification =
  document.querySelector("#weatherNotification");

const notificationIcon =
  document.querySelector("#notificationIcon");

const notificationTitle =
  document.querySelector("#notificationTitle");

const notificationMessage =
  document.querySelector("#notificationMessage");

const closeNotification =
  document.querySelector("#closeNotification");


// =====================================
// STORAGE
// =====================================

const STORAGE_KEY =
  "weatherlyLocation";


// =====================================
// WEATHER ICON
// =====================================

function getWeatherIcon(code) {

  if (code === 0) {
    return "☀️";
  }

  if (code === 1 || code === 2) {
    return "⛅";
  }

  if (code === 3) {
    return "☁️";
  }

  if (code >= 45 && code <= 48) {
    return "🌫️";
  }

  if (code >= 51 && code <= 67) {
    return "🌧️";
  }

  if (code >= 71 && code <= 77) {
    return "❄️";
  }

  if (code >= 80 && code <= 82) {
    return "🌦️";
  }

  if (code >= 95) {
    return "⛈️";
  }

  return "🌤️";
}


// =====================================
// WEATHER DESCRIPTION
// =====================================

function getWeatherDescription(code) {

  if (code === 0) {
    return "Clear Sky";
  }

  if (code === 1) {
    return "Mainly Clear";
  }

  if (code === 2) {
    return "Partly Cloudy";
  }

  if (code === 3) {
    return "Cloudy";
  }

  if (code >= 45 && code <= 48) {
    return "Foggy";
  }

  if (code >= 51 && code <= 67) {
    return "Rainy";
  }

  if (code >= 71 && code <= 77) {
    return "Snowy";
  }

  if (code >= 80 && code <= 82) {
    return "Rain Showers";
  }

  if (code >= 95) {
    return "Thunderstorm";
  }

  return "Unknown";
}


// =====================================
// SAVE LOCATION
// =====================================

function saveLocation(location) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(location)
    );

  } catch (error) {

    console.error(
      "Could not save location:",
      error
    );
  }
}


// =====================================
// GET SAVED LOCATION
// =====================================

function getSavedLocation() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);

  } catch (error) {

    console.error(
      "Could not load saved location:",
      error
    );

    return null;
  }
}


// =====================================
// LOADING
// =====================================

function showLoading() {

  if (weatherIcon) {
    weatherIcon.textContent = "🔄";
  }

  if (temperatureText) {
    temperatureText.textContent = "--°C";
  }

  if (conditionText) {
    conditionText.textContent =
      "Getting weather...";
  }
}


// =====================================
// ERROR
// =====================================

function showError(message) {

  console.error(message);

  if (weatherIcon) {
    weatherIcon.textContent = "⚠️";
  }

  if (temperatureText) {
    temperatureText.textContent = "--°C";
  }

  if (conditionText) {
    conditionText.textContent = message;
  }
}


// =====================================
// SEARCH WEATHER
// =====================================

async function searchWeather() {

  const city =
    searchInput
      ? searchInput.value.trim()
      : "";

  if (!city) {

    showError(
      "Please enter a city."
    );

    return;
  }

  showLoading();

  if (searchButton) {

    searchButton.disabled = true;

    searchButton.textContent =
      "Searching...";
  }

  try {

    const url =
      "https://geocoding-api.open-meteo.com/v1/search" +
      "?name=" +
      encodeURIComponent(city) +
      "&count=1" +
      "&language=en" +
      "&format=json";

    const response =
      await fetch(url);

    if (!response.ok) {

      throw new Error(
        "City search failed."
      );
    }

    const data =
      await response.json();

    if (
      !data.results ||
      data.results.length === 0
    ) {

      showError(
        "City not found."
      );

      return;
    }

    const result =
      data.results[0];

    const location = {

      latitude:
        result.latitude,

      longitude:
        result.longitude,

      city:
        result.name,

      country:
        result.country || ""
    };

    saveLocation(location);

    await getWeather(
      location.latitude,
      location.longitude,
      location.city,
      location.country
    );

  } catch (error) {

    console.error(
      "Search error:",
      error
    );

    showError(
      "Unable to get weather."
    );

  } finally {

    if (searchButton) {

      searchButton.disabled = false;

      searchButton.textContent =
        "Search";
    }
  }
}


// =====================================
// GET WEATHER FROM OPEN-METEO
// =====================================

async function getWeather(
  latitude,
  longitude,
  city,
  country
) {

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" +
    latitude +
    "&longitude=" +
    longitude +
    "&current=" +
    "temperature_2m," +
    "relative_humidity_2m," +
    "apparent_temperature," +
    "wind_speed_10m," +
    "weather_code" +
    "&daily=" +
    "weather_code," +
    "temperature_2m_max," +
    "temperature_2m_min," +
    "sunrise," +
    "sunset" +
    "&timezone=auto" +
    "&forecast_days=4";

  const response =
    await fetch(url);

  if (!response.ok) {

    throw new Error(
      "Weather API request failed."
    );
  }

  const data =
    await response.json();

  if (
    !data.current ||
    !data.daily
  ) {

    throw new Error(
      "Weather data is unavailable."
    );
  }

  updateCurrentWeather(
    data.current,
    city,
    country
  );

  updateForecast(
    data.daily
  );

  updateSunTimes(
    data.daily
  );
}


// =====================================
// CURRENT WEATHER
// =====================================

function updateCurrentWeather(
  current,
  city,
  country
) {

  if (locationText) {

    locationText.textContent =
      country
        ? `${city}, ${country}`
        : city;
  }

  if (weatherIcon) {

    weatherIcon.textContent =
      getWeatherIcon(
        current.weather_code
      );
  }

  if (temperatureText) {

    temperatureText.textContent =
      `${Math.round(
        current.temperature_2m
      )}°C`;
  }

  if (conditionText) {

    conditionText.textContent =
      getWeatherDescription(
        current.weather_code
      );
  }

  const details =
    document.querySelectorAll(
      ".detail-card strong"
    );

  if (details[0]) {

    details[0].textContent =
      `${current.relative_humidity_2m}%`;
  }

  if (details[1]) {

    details[1].textContent =
      `${Math.round(
        current.wind_speed_10m
      )} km/h`;
  }

  if (details[2]) {

    details[2].textContent =
      `${Math.round(
        current.apparent_temperature
      )}°C`;
  }

  updateBackground(
    current.weather_code
  );

  showNotification(
    current.weather_code,
    current.temperature_2m
  );
}


// =====================================
// 3-DAY FORECAST
// =====================================

function updateForecast(daily) {

  const cards =
    document.querySelectorAll(
      ".forecast-card"
    );

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const card =
      cards[i];

    if (!card) {
      continue;
    }

    const index =
      i + 1;

    const date =
      new Date(
        daily.time[index]
      );

    const day =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "short"
        }
      );

    const code =
      daily.weather_code[index];

    const high =
      Math.round(
        daily.temperature_2m_max[index]
      );

    const low =
      Math.round(
        daily.temperature_2m_min[index]
      );

    const dayElement =
      card.querySelector("p");

    const iconElement =
      card.querySelector(
        ".forecast-icon"
      );

    const temperatureElement =
      card.querySelector("strong");

    const conditionElement =
      card.querySelector(
        ".forecast-condition"
      );

    if (dayElement) {

      dayElement.textContent =
        day;
    }

    if (iconElement) {

      iconElement.textContent =
        getWeatherIcon(code);
    }

    if (temperatureElement) {

      temperatureElement.textContent =
        `${high}° / ${low}°`;
    }

    if (conditionElement) {

      conditionElement.textContent =
        getWeatherDescription(code);
    }
  }
}


// =====================================
// SUNRISE + SUNSET
// =====================================

function updateSunTimes(daily) {

  const sunrise =
    document.querySelector(
      "#sunrise"
    );

  const sunset =
    document.querySelector(
      "#sunset"
    );

  if (
    sunrise &&
    daily.sunrise &&
    daily.sunrise[0]
  ) {

    sunrise.textContent =
      formatTime(
        daily.sunrise[0]
      );
  }

  if (
    sunset &&
    daily.sunset &&
    daily.sunset[0]
  ) {

    sunset.textContent =
      formatTime(
        daily.sunset[0]
      );
  }
}


// =====================================
// FORMAT TIME
// =====================================

function formatTime(time) {

  const date =
    new Date(time);

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}


// =====================================
// BACKGROUND
// =====================================

function updateBackground(code) {

  document.body.classList.remove(
    "sunny",
    "cloudy",
    "rainy",
    "stormy"
  );

  if (code === 0) {

    document.body.classList.add(
      "sunny"
    );

  } else if (
    code >= 1 &&
    code <= 3
  ) {

    document.body.classList.add(
      "cloudy"
    );

  } else if (
    code >= 51 &&
    code <= 82
  ) {

    document.body.classList.add(
      "rainy"
    );

  } else if (
    code >= 95
  ) {

    document.body.classList.add(
      "stormy"
    );
  }
}


// =====================================
// NOTIFICATION
// =====================================

function showNotification(
  code,
  temperature
) {

  if (!notification) {
    return;
  }

  let icon = "🌤️";

  let title =
    "Weather Update";

  let message =
    `Temperature is ${Math.round(
      temperature
    )}°C.`;

  if (code === 0) {

    icon = "☀️";

    title =
      "Clear Weather";

    message =
      "Enjoy the sunshine today!";

  } else if (
    code >= 1 &&
    code <= 3
  ) {

    icon = "☁️";

    title =
      "Cloudy Weather";

    message =
      "The sky is cloudy today.";

  } else if (
    code >= 51 &&
    code <= 82
  ) {

    icon = "🌧️";

    title =
      "Rain Alert";

    message =
      "You may want to carry an umbrella.";

  } else if (
    code >= 95
  ) {

    icon = "⛈️";

    title =
      "Storm Alert";

    message =
      "Thunderstorms are possible. Stay safe.";
  }

  if (notificationIcon) {

    notificationIcon.textContent =
      icon;
  }

  if (notificationTitle) {

    notificationTitle.textContent =
      title;
  }

  if (notificationMessage) {

    notificationMessage.textContent =
      message;
  }

  notification.classList.add(
    "show"
  );

  setTimeout(
    function() {

      notification.classList.remove(
        "show"
      );

    },
    5000
  );
}


// =====================================
// CLOSE NOTIFICATION
// =====================================

if (closeNotification) {

  closeNotification.addEventListener(
    "click",
    function() {

      notification.classList.remove(
        "show"
      );
    }
  );
}


// =====================================
// GPS
// =====================================

function useMyLocation() {

  console.log(
    "Weatherly GPS started..."
  );

  if (!navigator.geolocation) {

    showError(
      "GPS is not supported by this browser."
    );

    return;
  }

  if (locationButton) {

    locationButton.disabled =
      true;

    locationButton.textContent =
      "📍 Finding location...";
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(

    async function(position) {

      const latitude =
        position.coords.latitude;

      const longitude =
        position.coords.longitude;

      console.log(
        "GPS coordinates:",
        latitude,
        longitude
      );

      try {

        let city =
          "Your Location";

        let country =
          "";

        // -----------------------------
        // Reverse geocoding
        // -----------------------------

        try {

          const locationURL =
            "https://api.bigdatacloud.net/data/" +
            "reverse-geocode-client" +
            "?latitude=" +
            latitude +
            "&longitude=" +
            longitude +
            "&localityLanguage=en";

          const locationResponse =
            await fetch(
              locationURL
            );

          if (locationResponse.ok) {

            const locationData =
              await locationResponse.json();

            city =
              locationData.city ||
              locationData.locality ||
              locationData.principalSubdivision ||
              "Your Location";

            country =
              locationData.countryName ||
              "";
          }

        } catch (error) {

          console.warn(
            "City detection unavailable:",
            error
          );
        }

        // -----------------------------
        // Save location
        // -----------------------------

        const location = {

          latitude:
            latitude,

          longitude:
            longitude,

          city:
            city,

          country:
            country
        };

        saveLocation(location);

        // -----------------------------
        // Update search box
        // -----------------------------

        if (searchInput) {

          searchInput.value =
            city;
        }

        // -----------------------------
        // Get weather
        // -----------------------------

        await getWeather(
          latitude,
          longitude,
          city,
          country
        );

        if (locationButton) {

          locationButton.textContent =
            "📍 Location Updated";

          setTimeout(
            function() {

              locationButton.disabled =
                false;

              locationButton.textContent =
                "📍 Use My Location";

            },
            2000
          );
        }

      } catch (error) {

        console.error(
          "GPS weather error:",
          error
        );

        showError(
          "Could not load weather for your location."
        );

        if (locationButton) {

          locationButton.disabled =
            false;

          locationButton.textContent =
            "📍 Try Again";
        }
      }
    },

    function(error) {

      console.error(
        "GPS error:",
        error
      );

      if (locationButton) {

        locationButton.disabled =
          false;

        locationButton.textContent =
          "📍 Try Again";
      }

      if (error.code === 1) {

        showError(
          "Location permission was denied."
        );

      } else if (error.code === 2) {

        showError(
          "Your location could not be found."
        );

      } else if (error.code === 3) {

        showError(
          "GPS timed out. Try again."
        );

      } else {

        showError(
          "Unable to get your location."
        );
      }
    },

    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000
    }
  );
}


// =====================================
// LOAD SAVED LOCATION
// =====================================

async function loadWeather() {

  const saved =
    getSavedLocation();

  if (
    saved &&
    typeof saved.latitude === "number" &&
    typeof saved.longitude === "number"
  ) {

    try {

      if (
        searchInput &&
        saved.city
      ) {

        searchInput.value =
          saved.city;
      }

      showLoading();

      await getWeather(
        saved.latitude,
        saved.longitude,
        saved.city || "Your Location",
        saved.country || ""
      );

      return;

    } catch (error) {

      console.warn(
        "Saved location failed:",
        error
      );

      localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }

  // First visit
  useMyLocation();
}


// =====================================
// SEARCH BUTTON
// =====================================

if (searchButton) {

  searchButton.addEventListener(
    "click",
    searchWeather
  );
}


// =====================================
// ENTER KEY
// =====================================

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        searchWeather();
      }
    }
  );
}


// =====================================
// GPS BUTTON
// =====================================

if (locationButton) {

  locationButton.addEventListener(
    "click",
    function(event) {

      event.preventDefault();

      useMyLocation();
    }
  );
}


// =====================================
// START WEATHERLY
// =====================================

loadWeather();
