// Dom elements
let weatherBlock1 = $('.weather-block-1');
let weatherBlock2 = $('.weather-block-2');
let weatherBlock3 = $('.weather-block-3');
let weatherBlock4 = $('.weather-block-4');
let weatherBlock5 = $('.weather-block-5');
let weatherBlock6 = $('.weather-block-6');
let submit = $('#submit');
let searchQ = $('#city-search').val();
let historyEL = $('#history');
let units = 'imperial';
let currentBlock = weatherBlock1;
let temp = 0;
let averageTemp = 0;
let humidity = 0;
let averageHumidity = 0;
let historyLoaded = false;

// If history exists in storage, create history from storage
if (localStorage.getItem('history')) {
    cityHistory = JSON.parse(localStorage.getItem('history'));
    createHistory();
    // Else set history to empty
} else {
    cityHistory = [];
    historyLoaded = true;
}

// If last serch exists, render the weather of the last search on page load
if (localStorage.getItem('last-search')) {
    renderAllWeather(localStorage.getItem('last-search'));
    //If last rearch does not exist, load weather from geo-coordinates
} else {
    emptyWeatherBlocks();
    currentBlock = weatherBlock1;
    getCurrentCoords();
}

// When submit is clicked, or enter is pressed, send the searched city to the API and render weather
submit.click(function(e) {
    e.preventDefault();
    searchQ = $('#city-search').val();
    // Make the first letter of the search always capitalized
    searchQ = searchQ.charAt(0).toUpperCase() + searchQ.slice(1);
    console.log(searchQ);
    // If the last search is the same as the current search, dont send the data to the API again
    if (searchQ === localStorage.getItem('last-search')){
        return;
    } else {
        //else render weather
        currentBlock = weatherBlock1;
        renderAllWeather(searchQ);
    }
});

// When a history button is pressed, send the information from the saved search into the API
historyEL.on('click', '.searched', function() {
    searchQ = $(this).text();
    // First letter of search to uppercase
    searchQ = searchQ.charAt(0).toUpperCase() + searchQ.slice(1);
    // If the last search matched the history that you are clicking, dont load the same info again
    if(searchQ === localStorage.getItem('last-search')) {
        return;
    } else {
        // Else render weather based off of the history button
        currentBlock = weatherBlock1;
        renderAllWeather(searchQ);
    }
});

// When an x button is pressed, delete the history item attached to the x button
historyEL.on('click', '.remove', function() {
    // Remove the history item from the history array that matched the x button clicked
    cityHistory = cityHistory.filter(a => a !== $(this).prev('.searched').text());
    // Set the local storage for history to the updated array
    localStorage.setItem(`history`, JSON.stringify(cityHistory));
    // remove the parent of the x button, removing the history item
    ($(this).parent()).remove();
});

// Function that renders all of the weather
function renderAllWeather(searchQ) {
    // Axaj call for current weather 
    let queryURLWeather = `http://api.openweathermap.org/data/2.5/weather?q=${searchQ}&units=${units}&APPID=2eccc5069a92b45c4e66fa64bfe81446`;
    $.ajax({
        url: queryURLWeather,
        method: 'GET'
    }).then(function(response) {
        // If successful...
        // Set last search to the current search
        localStorage.setItem('last-search', `${searchQ}`);
        // Run the history creating function
        createHistory(searchQ);
        // Empty the weather blocks
        emptyWeatherBlocks();
        // Render the current weather based on the response, using the render current weather function
        renderCurrentWeather(response,searchQ);
        // Ajax call for the 5 day weather forecast
        let queryURLForecast = `http://api.openweathermap.org/data/2.5/forecast?q=${searchQ}&units=${units}&APPID=2eccc5069a92b45c4e66fa64bfe81446`;
        $.ajax({
            url: queryURLForecast,
            method: 'GET'
        }).then(function(response) {;
            // Render 5 day forecast using the renderForecast function
            renderForecast(response,searchQ);
        });
    }, function() {
        // If not successful...
        alert('City not found, or input was invalid');
        return;
    });
       
}

// Function that renders the current weather
function renderCurrentWeather (response) {
        // Add styling
        weatherBlock1.addClass('border');
        // Add city name, weather description, load the icon, add the temp, humidity, and windspeed
        weatherBlock1.append($(`<h1 class="pt-3">${response.name}</h1>`),
        $('<hr>'),
        $('<h1>Now</h1>'),
        $(`<h2>${response.weather[0].description}</h2>`),
        $(`<img src="http://openweathermap.org/img/w/${response.weather[0].icon}.png"></img>`),
        $(`<h2>Current Temp:  ${Math.round(response.main.temp)}&#176</h2>`),
        $(`<h2>Humidity: ${response.main.humidity}%</h2>`),
        $(`<h2>Wind speed: ${Math.round(response.wind.speed)}MPH</h2>`));
        ////////////////////////////////////////////////////////////////////////////////////////////
        let lat = response.coord.lat;
        let lon = response.coord.lon;
        // Get the longitude and latitude of the searched city and pass that in to the uvi index API search
        let queryURLUV = `http://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&APPID=2eccc5069a92b45c4e66fa64bfe81446`;
        $.ajax({  
            url: queryURLUV,
            method: 'GET'
        }).then(function(response) {
            // Add the uv index
            weatherBlock1.append(`<h2 class="pb-4">UV index: ${response.value}</h2>`);
        });
}

// Function that renders the 5 day forecast
function renderForecast(response) {
    // This nested for loop runs through groups of 8 objects from the 5 day weather response, and averages
    // out the temperature, and the humidity for each day, and appends it its corresponding weather block
    for (var i = 0; i < 40; i += 8) {
        // set the target weather block to the next block, starting at one, so the first block to be appended
        // to for the 5 day weather forecast, starts at the second block
        currentBlock = currentBlock.next();
        // Zeroing out the variables, so it can accurately calculate the averages for each block
        temp = 0;
        averageTemp = 0;
        humidity = 0;
        averageHumidity = 0;
        // Add styling
        currentBlock.addClass('border');
        // Add city name, the day of the week, the icon, and the weather description
        currentBlock.append(
            $(`<h3 class="pt-3">${response.city.name}<h3>`),
            $('<hr>'),
            $(`<h4>${moment(response.list[i].dt_txt).format('dddd')}</h4>`),
            $(`<img src="http://openweathermap.org/img/w/${response.list[i].weather[0].icon}.png"></img>`),
            $(`<p>${response.list[i].weather[0].description}<p>`));
        for (var j = 0; j < 8; j++) {
            // Add up the data from each block of 8, and average out the numbers
           temp += response.list[i+j].main.temp;
           humidity += response.list[i+j].main.humidity;
        }
        // Average out the numbers
        averageTemp = Math.round(temp/8)
        averageHumidity = Math.round(humidity/8)
        // Add the average numbers to the weather blocks 
        currentBlock.append(
            $(`<p>Average Temp: ${averageTemp}&#176F</p>`),
            $(`<p>Average Humidity: ${averageHumidity}%</p>`),
        );
    }
}

// Create history function
function createHistory (searchQ) {
    // If no div exists with the class of the current city being searched, and history has been loaded,
    // then append a div with a class and text set to the name of the city being searched
    // also add a remove button to the history item
    if(!($('div').hasClass(`${searchQ}`)) && historyLoaded === true) {
        //creating the elements
        historyEL.append(`<div class="col-sm-12 col-md-3 text-center"><div class="border shadow-sm searched ${searchQ} pl-1 pr-1 mt-3">${searchQ}</div>
        <button class="remove shadow-sm">X</button>
        </div>`);
        // Adding the search to the history array
        cityHistory.push(`${searchQ}`);
        // Updating history array in the local storage
        localStorage.setItem(`history`, JSON.stringify(cityHistory));
        // If history has not been loaded, use the local storage history array to create history items
    } else if (historyLoaded === false) {
        for(var i = 0; i < cityHistory.length; i++) {
            historyEL.append(`<div class="col-sm-12 col-md-3 text-center"><div class="border shadow-sm searched ${cityHistory[i]} pl-1 pr-1 mt-3">${cityHistory[i]}</div>
            <button class="remove shadow-sm">X</button>
            </div>`);
        }
        historyLoaded = true;
    }
}

// Function that loads the weather from coordinates
function renderFromCoords(lat, lon) {
    let queryURLCoords = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&APPID=2eccc5069a92b45c4e66fa64bfe81446`;
    $.ajax({  
        url: queryURLCoords,
        method: 'GET'
    }).then(function(response) {
        // Get city name from the coordinates
        searchQ = response.name;
        // Set last search to the city name
        localStorage.setItem('last-search', `${searchQ}`);
        // Render the weather using the city name
        renderAllWeather(searchQ);
        // Run the histoy creating function, to add this to history
        createHistory(searchQ);
        // Return city name
        return searchQ;
    });
}
// Geolocation from browser, to obtain coordinates
function getCurrentCoords () {
    navigator.geolocation.getCurrentPosition(success, fail)
}
// If Geolocation is successful, get the lat and lon
function success(position) {
    let lat = Math.round(position.coords.latitude);
    let lon = Math.round(position.coords.longitude);
    // Return lat and lon
    renderFromCoords(lat,lon);
}
// If Geolocation fails, do nothing
function fail() {
    return;
}

// Function that empties all of the weather blocks
function emptyWeatherBlocks () {
    weatherBlock1.empty();
    weatherBlock2.empty();
    weatherBlock3.empty();
    weatherBlock4.empty();
    weatherBlock5.empty();
    weatherBlock6.empty();
}