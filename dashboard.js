const API_KEY = 'f134b2a8f7bccf57d6bf77bb5f56f571';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

let currentCity = '';
let units = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit

// Retrieves the user's current geolocation
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

// Fetches weather data based on latitude and longitude
async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

// Shows the loading spinner and reduces opacity of weather widget and chart
function showLoading() {
    document.getElementById('spinner').classList.remove('hidden');
    document.getElementById('weatherWidget').classList.add('opacity-50');
    document.getElementById('chart').classList.add('opacity-50');
}

// Hides the loading spinner and restores opacity of weather widget and chart
function hideLoading() {
    document.getElementById('spinner').classList.add('hidden');
    document.getElementById('weatherWidget').classList.remove('opacity-50');
    document.getElementById('chart').classList.remove('opacity-50');
}

// Fetches weather data for a given city or uses geolocation if no city is provided
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
                weatherData = await fetchCurrentWeather('Islamabad'); // Default city
            }
        } else {
            weatherData = await fetchCurrentWeather(city);
        }

        currentCity = weatherData.name;
        const forecast = await fetchForecast(currentCity);

        updateWeatherWidget(weatherData);
        clearCharts();
        createCharts(forecast);
        updateUnitDisplay();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Fetches current weather data for a given city
async function fetchCurrentWeather(city) {
    const response = await fetch(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

// Fetches forecast data for a given city
async function fetchForecast(city) {
    const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=${units}&appid=${API_KEY}`);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    const data = await response.json();
    return processForecastData(data.list);
}

// Processes the raw forecast data to get daily data
function processForecastData(data) {
    const dailyData = {};
    data.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyData[date]) {
            dailyData[date] = {
                temperature: item.main.temp,
                condition: item.weather[0].main,
                icon: item.weather[0].icon
            };
        }
    });
    return Object.entries(dailyData).map(([date, data]) => ({ date, ...data }));
}



let tempChart, conditionChart, tempLineChart;

// Creates charts for temperature and weather conditions
function createCharts(forecast) {
    if (tempChart) tempChart.destroy();
    if (conditionChart) conditionChart.destroy();
    if (tempLineChart) tempLineChart.destroy();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart',
        },
    };

    setTimeout(() => {
        tempChart = new Chart(document.getElementById('tempChart'), {
            type: 'bar',
            data: {
                labels: forecast.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: `Temperature (${units === 'metric' ? '°C' : '°F'})`,
                    data: forecast.map(day => day.temperature),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        display: true,
                        text: '5-Day Temperature Forecast'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                animation: {
                    delay: 500, // Add delay for bar chart animation
                    duration: 1500,
                    easing: 'easeInOutBounce',
                }
            }
        });

        const conditions = forecast.map(day => day.condition);
        const uniqueConditions = [...new Set(conditions)];
        const conditionCounts = uniqueConditions.map(condition =>
            conditions.filter(c => c === condition).length
        );

        conditionChart = new Chart(document.getElementById('conditionChart'), {
            type: 'doughnut',
            data: {
                labels: uniqueConditions,
                datasets: [{
                    data: conditionCounts,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Weather Conditions Distribution'
                    }
                },
                animation: {
                    delay: 500, // Add delay for doughnut chart animation
                    duration: 1500,
                    easing: 'easeInOutBounce',
                }
            }
        });

        tempLineChart = new Chart(document.getElementById('tempLineChart'), {
            type: 'line',
            data: {
                labels: forecast.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })),
                datasets: [{
                    label: `Temperature (${units === 'metric' ? '°C' : '°F'})`,
                    data: forecast.map(day => day.temperature),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Temperature Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeOutBounce', // Drop effect for line chart
                }
            }
        });
    }, 100);
}


// Clears all charts
function clearCharts() {
    if (tempChart) {
        tempChart.destroy();
        tempChart = null;
    }
    if (conditionChart) {
        conditionChart.destroy();
        conditionChart = null;
    }
    if (tempLineChart) {
        tempLineChart.destroy();
        tempLineChart = null;
    }
}

// Updates the display of the temperature unit toggle button
function updateUnitDisplay() {
    const unitToggle = document.getElementById('unitToggle');
    unitToggle.textContent = units === 'metric' ? '°C' : '°F';
}

// Displays an error message
function showError(message) {
    const errorElement = document.createElement('div');
    if (message.includes('Not Found')) {
        message = 'City not found. Please try again.';
    }

    errorElement.textContent = `Error: ${message}`;
    errorElement.className = 'bg-red-100 border border-red-400 text-red-700 m-1 px-4 py-3 rounded-lg relative fade-in';
    const mainElement = document.querySelector('main');
    mainElement.insertBefore(errorElement, mainElement.firstChild);
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => errorElement.remove(), 500);
    }, 5000);
}

// Initializes the weather app
function initializeWeatherApp() {
    fetchWeatherData();
    updateUnitDisplay();
}

// Event listeners for when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    const unitToggle = document.getElementById('unitToggle');
    unitToggle.addEventListener('click', function () {
        units = units === 'metric' ? 'imperial' : 'metric';
        if (currentCity) {
            fetchWeatherData(currentCity);
        }
    });

    const searchInput = document.querySelector('#citySearch');
    const bttn = document.querySelector('#search');
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchWeatherData(this.value);
        }
    });

    bttn.addEventListener('click', function () {
        fetchWeatherData(searchInput.value);
    });

    initializeWeatherApp();
});

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const sidebar = document.querySelector('aside');
const header = document.querySelector('header');
const weatherWidget = document.getElementById('weatherWidget');
const chartContainers = document.querySelectorAll('#chart > div');
const searchInput = document.getElementById('citySearch');
const weatherInfo = document.getElementById('weatherInfo');
const sidebarLinks = document.querySelectorAll('aside nav a');
const current = document.getElementById('current');

let isDarkMode = true;

// Event listener for theme toggle button
themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    updateTheme();
});

// Updates the theme based on the isDarkMode state
function updateTheme() {
    if (isDarkMode) {
        // Apply dark mode styles
        body.classList.remove('bg-gray-100');
        body.classList.add('bg-gray-900', 'text-gray-200');
        sidebar.classList.remove('bg-gradient-to-b', 'from-blue-600', 'to-blue-800');
        sidebar.classList.add('bg-gray-800');
        header.classList.remove('bg-white');
        header.classList.add('bg-gray-800');
        weatherWidget.classList.remove('bg-white');
        weatherWidget.classList.add('bg-gray-800');
        searchInput.classList.remove('border-gray-300');
        searchInput.classList.add('border-gray-600', 'bg-gray-700', 'text-white');
        weatherInfo.classList.add('text-gray-200');
        weatherInfo.classList.remove('text-gray-600');
        
        sidebarLinks.forEach(link => {
            link.classList.remove('hover:bg-blue-100');
            link.classList.add('hover:bg-gray-600');
        });
        current.classList.remove('bg-blue-500');
        current.classList.add('bg-gray-700');
        chartContainers.forEach(container => {
            container.classList.remove('bg-white');
            container.classList.add('bg-gray-800','bg-opacity-80');
        });
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebarToggle.classList.remove('text-black');
        sidebarToggle.classList.add('text-white');
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>';
    } else {
        // Apply light mode styles
        body.classList.remove('bg-gray-900', 'text-gray-200');
        body.classList.add('bg-gray-100');
        sidebar.classList.remove('bg-gray-800');
        sidebar.classList.add('bg-gradient-to-b', 'from-blue-600', 'to-blue-800');
        header.classList.remove('bg-gray-800');
        header.classList.add('bg-white');
        weatherWidget.classList.remove('bg-gray-800');
        weatherWidget.classList.add('bg-white');
        searchInput.classList.remove('border-gray-600', 'bg-gray-700', 'text-white');
        searchInput.classList.add('border-gray-300');
        weatherInfo.classList.add('text-gray-600');
        chartContainers.forEach(container => {
            
            container.classList.remove('bg-gray-800');
            container.classList.add('bg-white','bg-opacity-80');
        });
        current.classList.remove('bg-gray-700');
        current.classList.add('bg-blue-500');
        sidebarLinks.forEach(link => {
            link.classList.remove('hover:bg-gray-600');
            link.classList.add('hover:bg-blue-500');
        });
        const sidebarToggle = document.getElementById('sidebarToggle');
        sidebarToggle.classList.remove('text-white');
        sidebarToggle.classList.add('text-black');
        themeToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>';
    }
}

// Initialize theme
updateTheme();

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



function updateWeatherWidget(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    const weatherIcon = document.getElementById('weatherIcon');
  
    const weatherWidget = document.getElementById('body');
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const windSpeedUnit = units === 'metric' ? 'm/s' : 'mph';
    weatherInfo.innerHTML = `
        <p class="text-2xl font-bold mb-2">${data.name}</p>
        <p class="text-4xl font-bold mb-4">${data.main.temp.toFixed(1)}${tempUnit}</p>
        <p class="mb-1">Humidity: ${data.main.humidity}%</p>
        <p class="mb-1">Wind Speed: ${data.wind.speed} ${windSpeedUnit}</p>
        <p>${data.weather[0].description}</p>
    `;
    weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;

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