import Navigo from "navigo";
import { camelCase } from "lodash";
import { header, nav, main, footer } from "./components";
import * as store from "./store/index.js";
import axios from "axios";

const router = new Navigo("/");

function render(state = store.home) {
  document.querySelector("#root").innerHTML = `
    ${header(state)}
    ${nav(store.nav)}
    ${main(state)}
    ${footer()}
  `;
  router.updatePageLinks();

  afterRender(state);

}

function afterRender(state) {
  // add menu toggle to bars icon in nav bar
  document.querySelector(".fa-bars").addEventListener("click", () => {
    document.querySelector("nav > ul").classList.toggle("hidden--mobile");
  });

  if (state.view === "order") {
    // Add an event handler for the submit button on the form
    document.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
  
     // Get the form element
      const inputList = event.target.elements;
      console.log("Input Element List", inputList);
  
      //Create an empty array to hold the toppings
      const toppings = [];
  
      // Iterate over the toppings array
  
      for (let input of inputList.toppings) {
        // If the value of the checked attribute is true then add the value to the toppings array
        if (input.checked) {
          toppings.push(input.value);
        }
      }
  
      // Create a request body object to send to the API
      const requestData = {
        customer: inputList.customer.value,
        crust: inputList.crust.value,
        cheese: inputList.cheese.value,
        sauce: inputList.sauce.value,
        toppings: toppings
      };
       //Log the request body to the console
       console.log("request Body", requestData);
     
       axios
          //Make a POST request to the API to create a new pizza
         .post(`${process.env.PIZZA_PLACE_API_URL}/pizzas`, requestData) 
         .then(response => {
        //Then push the new pizza onto the Pizza state pizzas attribute, so it can be displayed in the pizza list
           store.pizza.pizzas.push(response.data);
           router.navigate("/Pizza");
         })
        // If there is an error log it to the console
         .catch(error => {
           console.log("It puked", error);
         });
    });
  }
}

// 723e0986e0f98b33c0d046e7f38d272c

// https://api.openweathermap.org/data/2.5/weather?q=St. Louis&APPID=${process.env.OPEN_WEATHER_MAP_API_KEY}

router.hooks({
  before: (done, params) => {
    // We need to know what view we are on to know what data to fetch
    const view =
      params && params.data && params.data.view
        ? camelCase(params.data.view)
        : "home";
    // Add a switch case statement to handle multiple routes
    switch (view) {
      // Add a case for each view that needs data from an API
      // New Case for the home View
      case "home":
        axios
          // Get request to retrieve the current weather data using the API key and providing a city name
          .get(
            `https://api.openweathermap.org/data/2.5/weather?appid=${process.env.OPEN_WEATHER_MAP_API_KEY}&units=imperial&q=st%20louis`
          )
          .then(response => {
            console.log("Weather Data: ", response.data)
            // Create an object to be stored in the Home state from the response
            store.home.weather = {
              city: response.data.name,
              temp: response.data.main.temp,
              feelsLike: response.data.main.feels_like,
              description: response.data.weather[0].main
            };

            // An alternate method would be to store the values independently
            /*
      store.Home.weather.city = response.data.name;
      store.Home.weather.temp = kelvinToFahrenheit(response.data.main.temp);
      store.Home.weather.feelsLike = kelvinToFahrenheit(response.data.main.feels_like);
      store.Home.weather.description = response.data.weather[0].main;
      */
            done();
          })
          .catch(err => {
            console.log(err);
            done();
          });
        break;

      case "pizza":
        // New Axios get request utilizing already made environment variable
        axios
          .get(`${process.env.PIZZA_PLACE_API_URL}/pizzas`)
          .then(response => {
            // We need to store the response to the state, in the next step but in the meantime let's see what it looks like so that we know what to store from the response.
            console.log("response", response);
            store.pizza.pizzas = response.data;
            done();
          })
          .catch(error => {
            console.log("It puked", error);
            done();
          });
        break;
      default:
        done();
    }
  },
  already: params => {
    const view =
      params && params.data && params.data.view
        ? camelCase(params.data.view)
        : "home";

    render(store[view]);
  }
});

router
  .on({
    "/": () => render(store.home),
    ":view": ({ data, params }) => {
      // data?.view checks if view exists, then ternary runs
      const view = data?.view ? camelCase(data.view) : "home";
      if (view in store) {
        // store[view]
        render(store[view]);
      } else {
        console.log(`View ${view} not defined`);
        render(store.viewNotFound);
      }
    }
  })
  .notFound(() => render(store.viewNotFound))
  .resolve();