# Weather Dashboard
URL: https://weather-app-steel-tau-62.vercel.app/index.html
GITHUB: https://github.com/ghausdev/WeatherApp
## Description

Weather Dashboard is a modern, responsive web application that provides real-time weather information and forecasts. Built with vanilla JavaScript, HTML5, and styled with Tailwind CSS, this app offers an intuitive interface for users to check current weather conditions and 5-day forecasts for any city worldwide.

## Features

- **Real-time Weather Data**: Fetches current weather information from OpenWeatherMap API.
- **5-Day Forecast**: Displays a 5-day weather forecast with temperature and condition details.
- **City Search**: Allows users to search for weather information of any city.
- **Geolocation Support**: Automatically detects and displays weather for the user's current location.
- **Unit Toggle**: Switch between Celsius and Fahrenheit temperature units.
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing.
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices.
- **Interactive Charts**: Visualize temperature trends and weather conditions using Chart.js.
- **Data Filtering**: Sort and filter weather data in the table view.
- **Pagination**: Navigate through forecast data with easy-to-use pagination controls.
- **Weather Chatbot**: AI-powered chatbot to answer weather-related queries using the Gemini API.

## Pages

1. **Dashboard**: Displays current weather, temperature charts, and condition distribution.
2. **Tables**: Shows a detailed 5-day forecast in a tabular format with sorting and filtering options.

## Technologies Used

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6+)
- Chart.js for data visualization
- OpenWeatherMap API for weather data
- Gemini API for chatbot functionality
- Select2 for enhanced dropdowns

## Setup and Installation

1. Clone the repository:
2. Navigate to the project directory:
3. Open `dashboard.html` or `tables.html` in a web browser to run the application.

## Configuration

To use this application, you need to set up API keys:

1. OpenWeatherMap API:
- Sign up at [OpenWeatherMap](https://openweathermap.org/api) to get an API key.
- Replace `API_KEY` in `dashboard.js` and `tables.js` with your actual API key.

2. Gemini API:
- Obtain an API key from Google's Gemini AI platform.
- Replace `GEMINI_API_KEY` in `tables.js` with your Gemini API key.

## Usage

- Use the search bar to look up weather information for a specific city.
- Toggle between Celsius and Fahrenheit using the unit toggle button.
- Switch between light and dark modes using the theme toggle button.
- On the Tables page, use the dropdown to sort and filter the forecast data.
- Interact with the chatbot to ask weather-related questions.


## Acknowledgements

- [OpenWeatherMap API](https://openweathermap.org/api)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [Google Gemini AI](https://deepmind.google/technologies/gemini/)
- [Select2](https://select2.org/)
