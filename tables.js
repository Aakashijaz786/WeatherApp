// API keys and base URLs
const API_KEY = 'f134b2a8f7bccf57d6bf77bb5f56f571';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEMINI_API_KEY = 'AIzaSyCF6GyJNeIe2uROGC4irTDUUUWe-sADVVQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Global variables
let currentCity = '';
let units = 'metric';
let forecastData = [];
let filteredData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// DOM elements for theme toggling
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const sidebar = document.querySelector('aside');
const header = document.querySelector('header');
const table = document.querySelector('table');
const chatbot = document.querySelector('.mt-6');
const searchInput = document.getElementById('citySearch');
const chatInput = document.getElementById('chatInput');
const sidebarLinks = document.querySelectorAll('aside nav a');
const current = document.getElementById('current');
const th = document.getElementById('tbh');

let isDarkMode = true;


const sidebarToggle = document.getElementById('sidebarToggle');
const main = document.querySelector('main');

// Event listener for sidebar toggle button
sidebarToggle.addEventListener('click', () => {


    sidebar.classList.toggle('-translate-x-full');
});

// Close sidebar when clicking outside on small screens
main.addEventListener('click', (e) => {
    if (window.innerWidth < 1024 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.add('-translate-x-full');
    }
});

// Adjust sidebar on window resize
window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
        sidebar.classList.remove('-translate-x-full');
    } else {
        sidebar.classList.add('-translate-x-full');
    }
});

// Geolocation support
/**
 * Gets the user's current geolocation
 * @returns {Promise} A promise that resolves with the latitude and longitude
 */
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lon: longitude });
                },
                error => {
                    reject(error);
                }
            );
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}

/**
 * Fetches weather data based on coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise} A promise that resolves with the weather data
 */
async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

/**
 * Shows the loading spinner
 */
function showLoading() {
    document.getElementById('spinner').classList.remove('hidden');
}

/**
 * Hides the loading spinner
 */
function hideLoading() {
    document.getElementById('spinner').classList.add('hidden');
}

/**
 * Fetches weather data for a given city or uses geolocation
 * @param {string} city - The city name (optional)
 */
async function fetchWeatherData(city) {
    showLoading();
    try {
        let weatherData;
        if (!city) {
            try {
                const coords = await getGeolocation();
                weatherData = await fetchWeatherByCoords(coords.lat, coords.lon);
            } catch (geoError) {
                console.error('Geolocation error:', geoError);
                weatherData = await fetchCurrentWeather('Islamabad');
            }
        } else {
            weatherData = await fetchCurrentWeather(city);
        }

        currentCity = weatherData.name;
        const forecast = await fetchForecast(currentCity);

        // Update the weather widget
        updateWeatherWidget(weatherData);

        forecastData = processForecastData(forecast);
        filteredData = [...forecastData];
        displayForecast(1);

        updateUnitDisplay();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Fetches current weather for a given city
 * @param {string} city - The city name
 * @returns {Promise} A promise that resolves with the current weather data
 */
async function fetchCurrentWeather(city) {
    const response = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

/**
 * Fetches forecast data for a given city
 * @param {string} city - The city name
 * @returns {Promise} A promise that resolves with the forecast data
 */
async function fetchForecast(city) {
    const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

/**
 * Processes the raw forecast data
 * @param {Object} data - The raw forecast data
 * @returns {Array} An array of processed daily forecast data
 */
function processForecastData(data) {
    const dailyData = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];  // YYYY-MM-DDTHH:mm:ss.sssZ
        if (!dailyData[date]) {
            dailyData[date] = {
                name: currentCity,
                date: date,
                temp: item.main.temp,
                condition: item.weather[0].main
            };
        }
    });
    return Object.values(dailyData);
}

/**
 * Displays the forecast data in the table
 * @param {number} page - The current page number
 */
function displayForecast(page) {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const tableBody = document.getElementById('forecastTable');
    tableBody.innerHTML = '';

    for (let i = startIndex; i < endIndex && i < filteredData.length; i++) {
        const row = tableBody.insertRow();
        row.className = 'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200';
        const nameCell = row.insertCell(0);
        const dateCell = row.insertCell(1);
        const tempCell = row.insertCell(2);
        const conditionCell = row.insertCell(3);

        nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white';
        dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300';
        tempCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300';
        conditionCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300';

        nameCell.textContent = filteredData[i].name;
        dateCell.textContent = filteredData[i].date;
        tempCell.textContent = `${filteredData[i].temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}`;
        conditionCell.textContent = filteredData[i].condition;
    }

    updatePagination();
}

/**
 * Updates the pagination information
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

/**
 * Updates the display of the temperature unit toggle
 */
function updateUnitDisplay() {
    const unitToggle = document.getElementById('unitToggle');
    unitToggle.textContent = units === 'metric' ? '°C' : '°F';
}

/**
 * Displays an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    const errorElement = document.createElement('div');
    if (message.includes('Not Found')) {
        message = 'City not found. Please try again.';
    }

    errorElement.textContent = `Error: ${message}`;
    errorElement.className = 'bg-red-100 border m-1 border-red-400 text-red-700 px-4 py-3 rounded relative fade-in';
    const mainElement = document.querySelector('main');
    mainElement.insertBefore(errorElement, mainElement.firstChild);
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => errorElement.remove(), 500);
    }, 5000);
}

/**
 * Sends a message to the Gemini API
 * @param {string} message - The message to send
 * @returns {Promise} A promise that resolves with the API response
 */
async function sendMessageToGemini(message) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: message
                        }
                    ]
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

/**
 * Handles chat messages and generates responses
 * @param {string} message - The user's message
 * @returns {string} HTML string containing the response
 */
async function handleChatMessage(message) {
    const lowercaseMessage = message.toLowerCase();

    if (lowercaseMessage.includes('weather')) {
        try {
            if (lowercaseMessage.includes('forecast')) {
                const forecastData = await fetchForecast(currentCity);
                const processedForecast = processForecastData(forecastData);
                const fiveDayForecast = processedForecast.slice(0, 5);

                let forecastResponse = `
                    <div class="weather-response">
                        <h3 class="text-xl font-bold mb-2">5-Day Forecast for <span class="text-blue-600">${currentCity}</span></h3>
                        <ul class="space-y-2">
                `;
                fiveDayForecast.forEach(day => {
                    forecastResponse += `
                        <li class="flex justify-between items-center bg-gray-100 p-2 rounded">
                            <span class="font-semibold">${day.date}</span>
                            <span>${day.temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}</span>
                            <span class="capitalize">${day.condition}</span>
                        </li>
                    `;
                });
                forecastResponse += `
                        </ul>
                    </div>
                `;
                return forecastResponse;
            } else if (lowercaseMessage.includes('ascending')) {
                filteredData.sort((a, b) => a.temp - b.temp);
                return `
                    <div class="weather-response">
                        <h3 class="text-lg font-semibold mb-2">Temperature Trend (Ascending)</h3>
                        <p>The coolest day is <span class="font-bold">${filteredData[0].date}</span> at <span class="text-blue-600 font-bold">${filteredData[0].temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}</span>.</p>
                    </div>
                `;
            } else if (lowercaseMessage.includes('descending')) {
                filteredData.sort((a, b) => b.temp - a.temp);
                return `
                    <div class="weather-response">
                        <h3 class="text-lg font-semibold mb-2">Temperature Trend (Descending)</h3>
                        <p>The warmest day is <span class="font-bold">${filteredData[0].date}</span> at <span class="text-red-600 font-bold">${filteredData[0].temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}</span>.</p>
                    </div>
                `;
            } else if (lowercaseMessage.includes('rain')) {
                const rainyDays = filteredData.filter(day => day.condition.toLowerCase().includes('rain'));
                if (rainyDays.length > 0) {
                    return `
                        <div class="weather-response">
                            <h3 class="text-lg font-semibold mb-2">Rainy Days Forecast</h3>
                            <p>There are <span class="font-bold text-blue-600">${rainyDays.length}</span> rainy days in the forecast.</p>
                            <p>The first rainy day is expected on <span class="font-bold">${rainyDays[0].date}</span>.</p>
                        </div>
                    `;
                } else {
                    return `
                        <div class="weather-response">
                            <h3 class="text-lg font-semibold mb-2">Rainy Days Forecast</h3>
                            <p>There are no rainy days in the current forecast.</p>
                        </div>
                    `;
                }
            } else if (lowercaseMessage.includes('highest')) {
                const highestTemp = filteredData.reduce((max, day) => day.temp > max.temp ? day : max);
                return `
                    <div class="weather-response">
                        <h3 class="text-lg font-semibold mb-2">Highest Temperature</h3>
                        <p>The highest temperature in the forecast is <span class="text-red-600 font-bold">${highestTemp.temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}</span> on <span class="font-bold">${highestTemp.date}</span>.</p>
                    </div>
                `;
            } else if (lowercaseMessage.includes('lowest')) {
                const lowestTemp = filteredData.reduce((min, day) => day.temp < min.temp ? day : min);
                return `
                    <div class="weather-response">
                        <h3 class="text-lg font-semibold mb-2">Lowest Temperature</h3>
                        <p>The lowest temperature in the forecast is <span class="text-blue-600 font-bold">${lowestTemp.temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}</span> on <span  class="font-bold">${lowestTemp.date}</span>.</p>
                    </div>
                `;
            } else {
                const weatherData = await fetchCurrentWeather(currentCity);
                return `
                    <div class="weather-response">
                        <h3 class="text-xl font-bold mb-2">Current Weather in <span class="text-blue-600">${weatherData.name}</span></h3>
                        <p class="text-lg">
                            <span class="capitalize">${weatherData.weather[0].description}</span> with a temperature of 
                            <span class="font-bold">${weatherData.main.temp.toFixed(1)}${units === 'metric' ? '°C' : '°F'}</span>
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return `
                <div class="weather-response error">
                    <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
                    <p>I'm sorry, I couldn't fetch the weather information at the moment. Please try again later.</p>
                </div>
            `;
        }
    } else {
        try {
            const geminiResponse = await sendMessageToGemini(message);
            return `
                <div class="gemini-response">
                    <h3 class="text-lg font-semibold mb-2">Gemini AI Response</h3>
                    <p>${geminiResponse}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return `
                <div class="gemini-response error">
                    <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
                    <p>I'm sorry, I encountered an error while processing your request. Please try again later.</p>
                </div>
            `;
        }
    }
}

/**
 * Adds a message to the chat display
 * @param {string} message - The message to add
 * @param {boolean} isUser - Whether the message is from the user
 */
function addMessageToChat(message, isUser = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `p-2 mb-2 rounded-lg ${isUser ? 'bg-blue-100 dark:bg-blue-800 text-right' : 'bg-gray-100 dark:bg-gray-600'} ${isUser ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'}`;
    messageElement.innerHTML = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', () => {
    const unitToggle = document.getElementById('unitToggle');
    unitToggle.addEventListener('click', function () {
        units = units === 'metric' ? 'imperial' : 'metric';
        if (currentCity) {
            fetchWeatherData(currentCity);
        }
    });

    const citySearch = document.getElementById('citySearch');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const searchButton = document.getElementById('search');

    searchButton.addEventListener('click', () => {
        fetchWeatherData(citySearch
            .value);
    }
    );

    citySearch.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchWeatherData(this.value);
        }
    });

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addMessageToChat(message, true);
            chatInput.value = '';
            const response = await handleChatMessage(message);
            addMessageToChat(response);
        }
    }

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayForecast(currentPage);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            displayForecast(currentPage);
        }
    });

    const filterDropdown = document.getElementById('filterDropdown');
    filterDropdown.addEventListener('change', function () {
        switch (this.value) {
            case 'sortAscending':
                filteredData.sort((a, b) => a.temp - b.temp);
                break;
            case 'sortDescending':
                filteredData.sort((a, b) => b.temp - a.temp);
                break;
            case 'filterRain':
                filteredData = forecastData.filter(day => day.condition.toLowerCase().includes('rain'));
                break;
            case 'showHighest':
                const highestTemp = forecastData.reduce((max, day) => day.temp > max.temp ? day : max);
                filteredData = [highestTemp];
                break;
            case 'resetFilters':
                filteredData = [...forecastData];
                break;
        }
        currentPage = 1;
        displayForecast(currentPage);
    });

    // Initialize Select2 for the filter dropdown
    $(document).ready(function () {
        $('#filterDropdown').select2({
            minimumResultsForSearch: Infinity
        });
    });

    fetchWeatherData();
    updateUnitDisplay();


});

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    updateTheme();
});

/**
 * Updates the theme based on the isDarkMode state
 */
function updateTheme() {
    if (isDarkMode) {
        // Apply dark mode styles
        body.classList.remove('bg-gray-100', 'text-gray-600');
        body.classList.add('bg-gray-900', 'text-gray-200');
        sidebar.classList.remove('bg-blue-600');
        sidebar.classList.add('bg-gray-800');
        header.classList.remove('bg-white');
        header.classList.add('bg-gray-800');
        table.classList.remove('bg-white');
        table.classList.add('bg-gray-800');
        chatbot.classList.remove('bg-white');
        chatbot.classList.add('bg-gray-800');
        searchInput.classList.remove('border-gray-300');
        searchInput.classList.add('border-gray-600', 'bg-gray-700', 'text-white');
        chatInput.classList.remove('border-gray-300');
        chatInput.classList.add('border-gray-600', 'bg-gray-700', 'text-white');
        th.classList.remove('bg-gray-200', 'text-gray-500');
        th.classList.add('bg-gray-700', 'text-white');
        sidebarLinks.forEach(link => {
            link.classList.remove('hover:bg-blue-100');
            link.classList.add('hover:bg-gray-600');
        });
        current.classList.remove('bg-blue-500');
        current.classList.add('bg-gray-700');
        document.querySelectorAll('thead tr').forEach(tr => {
            tr.classList.remove('bg-gray-200', 'text-gray-500');
            tr.classList.add('bg-gray-700', 'text-white');
        });
        document.querySelectorAll('tbody').forEach(tbody => {
            tbody.classList.remove('text-gray-600');
            tbody.classList.add('text-gray-400');
        });
        document.getElementById("ChatHead").classList.add('bg-gray-800');
        document.getElementById("ChatHead").classList.remove('bg-white');
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebarToggle.classList.remove('text-black');
        sidebarToggle.classList.add('text-white');
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>';
    } else {
        // Apply light mode styles
        document.getElementById("ChatHead").classList.remove('bg-gray-800');
        document.getElementById("ChatHead").classList.add('bg-white');
        body.classList.remove('bg-gray-900', 'text-gray-200');
        body.classList.add('bg-gray-100', 'text-gray-600');
        sidebar.classList.remove('bg-gray-800');
        sidebar.classList.add('bg-blue-600');
        header.classList.remove('bg-gray-800');
        header.classList.add('bg-white');
        table.classList.remove('bg-gray-800');
        table.classList.add('bg-white');
        chatbot.classList.remove('bg-gray-800');
        chatbot.classList.add('bg-white');
        searchInput.classList.remove('border-gray-600', 'bg-gray-700', 'text-white');
        searchInput.classList.add('border-gray-300');
        chatInput.classList.remove('border-gray-600', 'bg-gray-700', 'text-white');
        chatInput.classList.add('border-gray-300');
        current.classList.remove('bg-gray-700');
        current.classList.add('bg-blue-500');
        th.classList.remove('bg-gray-700', 'text-white');
        th.classList.add('bg-gray-200', 'text-gray-500');
        sidebarLinks.forEach(link => {
            link.classList.remove('hover:bg-gray-600');
            link.classList.add('hover:bg-blue-500');
        });
        document.querySelectorAll('thead tr').forEach(tr => {
            tr.classList.remove('bg-gray-700', 'text-white');
            tr.classList.add('bg-gray-200', 'text-gray-500');
        });
        document.querySelectorAll('tbody').forEach(tbody => {
            tbody.classList.remove('text-gray-400');
            tbody.classList.add('text-gray-600');
        });
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebarToggle.classList.remove('text-white');
        sidebarToggle.classList.add('text-black');
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>';
    }
}

// Initialize theme
updateTheme();



function updateWeatherWidget(data) {



    const weatherWidget = document.getElementById('body');


    // Update background image based on weather condition
    const weatherCondition = data.weather[0].main.toLowerCase();
    let backgroundImage = '';

    switch (weatherCondition) {
        case 'clear':
            backgroundImage = 'url("https://images.unsplash.com/photo-1601297183305-6df142704ea2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80")';
            break;
        case 'clouds':
            backgroundImage = 'url("https://images.unsplash.com/photo-1534088568595-a066f410bcda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1051&q=80")';
            break;
        case 'rain':
            backgroundImage = 'url("https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80")';
            break;
        case 'snow':
            backgroundImage = 'url("https://images.unsplash.com/photo-1491002052546-bf38f186af56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1208&q=80")';
            break;
        default:
            backgroundImage = 'url("https://images.unsplash.com/photo-1534088568595-a066f410bcda?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1051&q=80")';
    }

    weatherWidget.style.backgroundImage = backgroundImage;
}

