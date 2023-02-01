// navigation elements
const fab = document.querySelector(".fab");
const navBar = document.querySelector(".nav-bar");
const elasticWave = document.querySelector(".elastic-wave");
const timeLine = new TimelineMax(); // nav bar animation using tweenMax library
const navListPlanets = document.querySelectorAll(".nav-list-planets li");
const pathPlanet = 8; // used to detect planet name when clicking on nav bar
let actualPlanet = "welcomeScreen"; // tracks content being show
// loading-welcome screen elements
const title = document.getElementById("text-title");
const info = document.getElementById("text-info");
// bottom note
const note = document.querySelector(".note");
// vars to keep weather update diffs
const marsWeather = {};
const newMarsWeather = {};
const earthWeather = {};
// data of all planets without a weather station
const planetsData = [];
// Mars weather forecast cards
const rotateDegreesCard = 180;
const pathDayPosition = 8; // used to find the card-day to flip
const days = document.querySelectorAll(".day");
const modalWindCompass = document.querySelector(".modal-content");
const windBtnLastDay = document.querySelector(".wind-direction");
const windBtnDayOne = document
  .getElementById("three")
  .querySelector(".compass");
const windBtnDayTwo = document.getElementById("two").querySelector(".compass");
const windBtnDayThree = document
  .getElementById("one")
  .querySelector(".compass");
// preferences screen elements
const profileName = document.querySelector("input.profile-name");
const units = Array.from(document.getElementsByName("units"));
const weight = document.getElementById("weight");
const place = document.getElementById("place");
const saveBtn = document.querySelector(".save");
const formPrefs = document.getElementById("prefs");

// check local storage for first time offline data setup
preferencesStorageInit();

// event listeners
window.addEventListener("load", (event) => {
  loadDataSecuence();
});
formPrefs.addEventListener("change", setBtnSave);
weight.addEventListener("keyup", setBtnSave);
place.addEventListener("keyup", setBtnSave);
units.forEach((radio) => radio.addEventListener("change", handleUnitChange)); //Cº || Fº
fab.addEventListener("click", handleFABClick);
days.forEach((day) => day.addEventListener("click", fRotateCard));
modalWindCompass.addEventListener("click", closeModal);
modalWindCompass.parentElement.addEventListener("click", closeModal);
windBtnLastDay.addEventListener("click", function () {
  openModal(0);
});
windBtnDayThree.addEventListener("click", function () {
  openModal(1);
});
windBtnDayTwo.addEventListener("click", function () {
  openModal(2);
});
windBtnDayOne.addEventListener("click", function () {
  openModal(3);
});
saveBtn.addEventListener("click", handlePrefSave);
window.addEventListener("click", closeFAB);

/*
 * @description Checks if there is data stored locally and if not, adds default data
 */
function preferencesStorageInit() {
  // localStorage.clear(); //for debbuging

  if (!localStorage.profilename) {
    localStorage.profilename = "@stro";
  }
  if (!localStorage.units) {
    localStorage.units = "C";
  }
  if (!localStorage.weight) {
    localStorage.weight = "100";
  }
  if (!localStorage.place) {
    localStorage.place = "Space Coast, FL";
    localStorage.location = JSON.stringify({ lat: 28.75, lon: -82.5 });
  }
  // localStorage.removeItem('marsweatherdata'); //bug test
  if (!localStorage.marsweatherdata) {
    getDefaultData("marsweatherdata");
  }
  if (!localStorage.latestMarsCheck) {
    localStorage.latestMarsCheck = "Tue, 10 Dec 2019 00:00:01 GMT";
  }
  if (!localStorage.earthweatherdata) {
    getDefaultData("earthweatherdata");
  }
  if (!localStorage.latestEarthCheck) {
    localStorage.latestEarthCheck = "Tue, 10 Dec 2019 00:00:01 GMT";
  }
  if (!localStorage.planetsweatherdata) {
    getDefaultData("planetsweatherdata");
  }

  updatePrefsUI();
}

/* preferences */

/*
 * @description Changes form's submit button saved/unsaved
 */
function setBtnSave() {
  saveBtn.classList.remove("green");
  saveBtn.innerHTML = "SAVE";
}
function setBtnSaved() {
  saveBtn.classList.add("green");
  saveBtn.innerHTML = "SAVED";
}

/*
 * @description Handles Celsius < > Fahrenheit radial buttons
 */
function handleUnitChange() {
  const value = document.getElementById("weight");
  const unit = document.querySelector(".weight-container h2");
  let weight = value.value;
  if (this.value === "C") {
    weight = weight / 2.205;
    unit.innerHTML = "kgs";
  } else {
    weight = weight * 2.205;
    unit.innerHTML = "lbs";
  }
  value.value = Math.round(weight);
}

/*
 * @description Updates the preference's UI with localStorage data
 */
function updatePrefsUI() {
  profileName.value = localStorage.profilename;
  if (localStorage.units === "C") {
    units[0].checked = true;
    document.querySelector(".weight-container h2").innerHTML = "kgs";
  } else {
    units[1].checked = true;
    document.querySelector(".weight-container h2").innerHTML = "lbs";
  }
  weight.value = localStorage.weight;
  place.value = localStorage.place;
}

/*
 * @description Updates localStorage with user's preferences changes
 */
function handlePrefSave() {
  localStorage.profilename = profileName.value;
  localStorage.units = units.filter((radial) => radial.checked)[0].value;
  localStorage.weight = weight.value;
  setBtnSaved();
  if (localStorage.place !== place.value) checkPlaceLocation(place.value);
}

/*
 * @description Contacts OpenWeather API to check if the new location exists. Stores new LAT & LONG. Calls to get new weather data
 */
function checkPlaceLocation(place) {
  const url = `/earth/location/${place}`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        notification(
          "Earth Error Connection",
          "There was a problem contacting the server. Using local data instead.",
          "warning"
        );
        place.value = "ERROR Place not Found";
      }
      return response.json();
    })
    .then((data) => {
      if (data.cod === "404") {
        notification(
          "Place Not Found",
          "Cant find that place. If spelling is Ok then there is no weather stations for that location.",
          "normal"
        );
        document.getElementById("place").value = "Not Found";
      } else {
        const location = JSON.stringify(data.coord);
        localStorage.place = place;
        localStorage.location = location;
        updateEarthWeather();
      }
    })
    .catch((error) => {
      notification(
        "Place Not Found",
        "Cant find that place. If spelling is Ok then there is no weather stations for that location.",
        "normal"
      );
    });
}

/* planet mars */

/*
 * @description Updates localStorage Mars data. As some Martian days may not have data, mixes previous data with new one and keeps latest 4 Sols that have temperature data.
 */
function updateLocalMarsData() {
  //previously saved data
  const localMarsData = JSON.parse(localStorage.getItem("marsweatherdata"));
  //get new Sols with temperature data from InSight mission
  const solBatchToCheck = newMarsWeather.sol_keys;
  for (sol of solBatchToCheck) {
    if (newMarsWeather[sol].AT) {
      //adding new data
      localMarsData[sol] = newMarsWeather[sol];
      if (!localMarsData.sol_keys.includes(sol)) {
        //adding new key if not already (to avoid duplicates)
        localMarsData.sol_keys.push(sol);
      }
    }
  }
  //sort and keep latest 4 sols
  const tempSolKeys = localMarsData.sol_keys.sort().reverse();
  if (tempSolKeys.length > 4) {
    for (i = tempSolKeys.length; i > 4; i--) {
      const sol = tempSolKeys[i - 1];
      //deleting actual Sol data
      delete localMarsData[sol];
    }
  }
  //removiming extra Sols
  tempSolKeys.length = 4;
  //replacing with latest 4 Sols (keys)
  localMarsData.sol_keys = tempSolKeys;
  //store updated data to localStorage
  localStorage.setItem("marsweatherdata", JSON.stringify(localMarsData));
  //update latest check Date, to avoid contacting the API more than once a day
  localStorage.latestMarsCheck = new Date();
  //update-syncs object in memory from where UI is build
  Object.assign(marsWeather, { ...localMarsData });
}

/*
 * @description Checks if a day went by from previous check. Goes online or uses local stored data
 */
function getMarsWeatherCheck() {
  const today = new Date();
  const latestCheck = new Date(localStorage.latestMarsCheck);
  const updateInterval =
    (today.getTime() - latestCheck.getTime()) / (1000 * 3600 * 24);
  //  const updateInterval = 0.5; // force interval for debugging
  if (updateInterval > 1) {
    //time to check for new InSight mission weather data
    updateMarsWeather();
  } else {
    //no need to go online, use local data instead
    const localData = JSON.parse(localStorage.getItem("marsweatherdata"));
    Object.assign(marsWeather, { ...localData });
  }
}

/*
 * @description Fetchs data from InSight mission API through node endpoint
 */
function updateMarsWeather() {
  fetch("/mars")
    .then((response) => {
      if (!response.ok) {
        title.innerHTML = "Mars";
        info.innerHTML = "ERROR conencting, using Latest Local Data";
        document.querySelector("#mars-load .circle-dot").classList.add("error");
        document.querySelector("#mars-load .vert-bar").classList.add("error");
        document.querySelector("#mars-load img").style.transform =
          "translateY(-50px)";
        document.querySelector("#mars-load .vert-bar").style.transform =
          "translateY(-50px)";
        notification(
          "Mars Error Connection",
          "There was a problem contacting the server. Using local data instead.",
          "warning"
        );
        document.querySelector("#mars-load .circle-dot").classList.remove("ok");
        document.querySelector("#mars-load .vert-bar").classList.remove("ok");
        document.querySelector("#mars-load .circle-dot").classList.add("error");
        document.querySelector("#mars-load .vert-bar").classList.add("error");
        document.querySelector(".loading-container").classList.remove("show");
        document.querySelector(".loading-container").classList.add("hide");
        document.querySelector(".mars-container").classList.add("show");
        actualPlanet = "mars";
        document.querySelector(`#${actualPlanet}`).classList.add("active");
      }
      return response.json();
    })
    .then((data) => {
      Object.assign(newMarsWeather, { ...data });
      title.innerHTML = "Mars";
      info.innerHTML = "downlink OK, updating local data";
      document.querySelector("#mars-load .circle-dot").classList.add("ok");
      document.querySelector("#mars-load .vert-bar").classList.add("ok");
      updateLocalMarsData();
    })
    .catch((error) => {
      notification(
        "Mars Error Connection",
        "There was a problem contacting the server. Using local data instead.",
        "warning"
      );
      document.querySelector("#mars-load .circle-dot").classList.remove("ok");
      document.querySelector("#mars-load .vert-bar").classList.remove("ok");
      document.querySelector("#mars-load .circle-dot").classList.add("error");
      document.querySelector("#mars-load .vert-bar").classList.add("error");
      const localData = JSON.parse(localStorage.getItem("marsweatherdata"));
      Object.assign(marsWeather, { ...localData });
    });
}

/*
 * @description Shows weather data for each Sol that has recorded temperature
 */
function deployMarsUIwithData() {
  const marsWeather = JSON.parse(localStorage.getItem("marsweatherdata"));
  const weatherWithDataKeys = [];
  const marsDataToDeploy = {};
  const solChecked = marsWeather.sol_keys;

  //check which sols have data
  for (sol of solChecked) {
    if (marsWeather[sol].AT) {
      weatherWithDataKeys.push(sol);
      marsDataToDeploy[sol] = marsWeather[sol];
    }
  }

  const metric = localStorage.units === "C"; //get prefered units by user as a boolean
  const sol_1 = weatherWithDataKeys[0];
  document.getElementById("sol-1").innerHTML = `Sol ${sol_1}`;
  const sol_2 = weatherWithDataKeys[1];
  document.getElementById("sol-2").innerHTML = `Sol ${sol_2}`;
  const sol_3 = weatherWithDataKeys[2];
  document.getElementById("sol-3").innerHTML = `Sol ${sol_3}`;
  const sol_4 = weatherWithDataKeys[3];
  document.getElementById("sol-4").innerHTML = `Sol ${sol_4}`;
  //Sol 1 data (latest day)
  //season
  const season = marsDataToDeploy[sol_1].Season;
  document.getElementById("season").innerHTML = season; //TODO is it possible the API dont provide this?
  const dateSol_1 = new Date(marsDataToDeploy[sol_1].First_UTC); //TODO is it possible the API dont provide this?
  //formated date
  const day = dateSol_1.getDate();
  const month = getStringMonth(dateSol_1);
  const year = dateSol_1.getFullYear();
  const formatedDate = `${month} ${day}, ${year}`;
  document.getElementById("date").innerHTML = formatedDate;
  //surface temperature
  const highSol_1 = Math.round(marsDataToDeploy[sol_1].AT.mx); //TEMP is always available because of previous check
  const lowSol_1 = Math.round(marsDataToDeploy[sol_1].AT.mn); //TEMP is always available because of previous check
  document.getElementById("at-high-sol1").innerHTML = metric
    ? `${Math.round(highSol_1)}<span>C</span>`
    : `${Math.round(highSol_1 * 1.8 + 32)}<span>F</span>`;
  document.getElementById("at-low-sol1").innerHTML = metric
    ? `${Math.round(lowSol_1)}<span>C</span>`
    : `${Math.round(lowSol_1 * 1.8 + 32)}<span>F</span>`;
  //surface preasure
  const maxPRSol_1 = marsDataToDeploy[sol_1].PRE
    ? Math.round(marsDataToDeploy[sol_1].PRE.mx)
    : "N/A";
  const minPRSol_1 = marsDataToDeploy[sol_1].PRE
    ? Math.round(marsDataToDeploy[sol_1].PRE.mn)
    : "N/A";
  if (typeof maxPRSol_1 === "number") {
    document.getElementById(
      "pr-max-sol1"
    ).innerHTML = `${maxPRSol_1}<span>Pa</span>`;
  } else {
    document.getElementById("pr-max-sol1").innerHTML = maxPRSol_1;
  }
  if (typeof minPRSol_1 === "number") {
    document.getElementById(
      "pr-min-sol1"
    ).innerHTML = `${minPRSol_1}<span>Pa</span>`;
  } else {
    document.getElementById("pr-min-sol1").innerHTML = minPRSol_1;
  }
  //horizontal wind
  const maxHWSol_1 = marsDataToDeploy[sol_1].HWS
    ? Math.round(marsDataToDeploy[sol_1].HWS.mx)
    : "N/A";
  const minHWSol_1 = marsDataToDeploy[sol_1].HWS
    ? Math.round(marsDataToDeploy[sol_1].HWS.mn)
    : "N/A";
  if (typeof maxHWSol_1 === "number") {
    document.getElementById("hw-max-sol1").innerHTML = metric
      ? `${Math.round(maxHWSol_1)}<span>m/s</span>`
      : `${Math.round(maxHWSol_1 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-max-sol1").innerHTML = maxHWSol_1;
  }
  if (typeof minHWSol_1 === "number") {
    document.getElementById("hw-min-sol1").innerHTML = metric
      ? `${Math.round(minHWSol_1)}<span>m/s</span>`
      : `${Math.round(minHWSol_1 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-min-sol1").innerHTML = minHWSol_1;
  }
  //wind direction
  const directionWDSol_1 = marsDataToDeploy[sol_1].WD.most_common
    ? marsDataToDeploy[sol_1].WD.most_common.compass_point
    : "N/A";
  document.getElementById("wd-sol1").innerHTML = directionWDSol_1;

  //Sol 2 flipping card
  //surface temperature
  const highSol_2 = Math.round(marsDataToDeploy[sol_2].AT.mx); //TEMP is always available because of previous check
  const lowSol_2 = Math.round(marsDataToDeploy[sol_2].AT.mn); //TEMP is always available because of previous check
  document.getElementById("at-high-sol2").innerHTML = metric
    ? `${Math.round(highSol_2)}<span>C</span>`
    : `${Math.round(highSol_2 * 1.8 + 32)}<span>F</span>`;
  document.getElementById("at-low-sol2").innerHTML = metric
    ? `${Math.round(lowSol_2)}<span>C</span>`
    : `${Math.round(lowSol_2 * 1.8 + 32)}<span>F</span>`;
  //surface preasure
  const maxPRSol_2 = marsDataToDeploy[sol_2].PRE
    ? Math.round(marsDataToDeploy[sol_2].PRE.mx)
    : "N/A";
  const minPRSol_2 = marsDataToDeploy[sol_2].PRE
    ? Math.round(marsDataToDeploy[sol_2].PRE.mn)
    : "N/A";
  if (typeof maxPRSol_2 === "number") {
    document.getElementById("pr-max-sol2").innerHTML = `${Math.round(
      maxPRSol_2
    )}<span>Pa</span>`;
  } else {
    document.getElementById("pr-max-sol2").innerHTML = maxPRSol_2;
  }
  if (typeof minPRSol_2 === "number") {
    document.getElementById("pr-min-sol2").innerHTML = `${Math.round(
      minPRSol_2
    )}<span>Pa</span>`;
  } else {
    document.getElementById("pr-min-sol2").innerHTML = minPRSol_2;
  }
  //horizontal wind
  const maxHWSol_2 = marsDataToDeploy[sol_2].HWS
    ? Math.round(marsDataToDeploy[sol_2].HWS.mx)
    : "N/A";
  const minHWSol_2 = marsDataToDeploy[sol_2].HWS
    ? Math.round(marsDataToDeploy[sol_2].HWS.mn)
    : "N/A";
  if (typeof maxHWSol_2 === "number") {
    document.getElementById("hw-max-sol2").innerHTML = metric
      ? `${Math.round(maxHWSol_2)}<span>m/s</span>`
      : `${Math.round(maxHWSol_2 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-max-sol2").innerHTML = maxHWSol_2;
  }
  if (typeof minHWSol_2 === "number") {
    document.getElementById("hw-min-sol2").innerHTML = metric
      ? `${Math.round(minHWSol_2)}<span>m/s</span>`
      : `${Math.round(minHWSol_2 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-min-sol2").innerHTML = minHWSol_2;
  }
  //wind direction
  const directionWDSol_2 = marsDataToDeploy[sol_2].WD.most_common
    ? marsDataToDeploy[sol_2].WD.most_common.compass_point
    : "N/A";
  document.getElementById("wd-sol2").innerHTML = directionWDSol_2;

  //Sol 3 flipping card
  //surface temperature
  const highSol_3 = Math.round(marsDataToDeploy[sol_3].AT.mx); //TEMP is always available because of previous check
  const lowSol_3 = Math.round(marsDataToDeploy[sol_3].AT.mn); //TEMP is always available because of previous check
  document.getElementById("at-high-sol3").innerHTML = metric
    ? `${Math.round(highSol_3)}<span>C</span>`
    : `${Math.round(highSol_3 * 1.8 + 32)}<span>F</span>`;
  document.getElementById("at-low-sol3").innerHTML = metric
    ? `${Math.round(lowSol_3)}<span>C</span>`
    : `${Math.round(lowSol_3 * 1.8 + 32)}<span>F</span>`;
  //surface preasure
  const maxPRSol_3 = marsDataToDeploy[sol_3].PRE
    ? Math.round(marsDataToDeploy[sol_3].PRE.mx)
    : "N/A";
  const minPRSol_3 = marsDataToDeploy[sol_3].PRE
    ? Math.round(marsDataToDeploy[sol_3].PRE.mn)
    : "N/A";
  if (typeof maxPRSol_3 === "number") {
    document.getElementById("pr-max-sol3").innerHTML = `${Math.round(
      maxPRSol_3
    )}<span>Pa</span>`;
  } else {
    document.getElementById("pr-max-sol3").innerHTML = maxPRSol_3;
  }
  if (typeof minPRSol_3 === "number") {
    document.getElementById("pr-min-sol3").innerHTML = `${Math.round(
      minPRSol_3
    )}<span>Pa</span>`;
  } else {
    document.getElementById("pr-min-sol3").innerHTML = minPRSol_3;
  }
  //horizontal wind
  const maxHWSol_3 = marsDataToDeploy[sol_3].HWS
    ? Math.round(marsDataToDeploy[sol_3].HWS.mx)
    : "N/A";
  const minHWSol_3 = marsDataToDeploy[sol_3].HWS
    ? Math.round(marsDataToDeploy[sol_3].HWS.mn)
    : "N/A";
  if (typeof maxHWSol_3 === "number") {
    document.getElementById("hw-max-sol3").innerHTML = metric
      ? `${Math.round(maxHWSol_3)}<span>m/s</span>`
      : `${Math.round(maxHWSol_3 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-max-sol3").innerHTML = maxHWSol_3;
  }
  if (typeof minHWSol_3 === "number") {
    document.getElementById("hw-min-sol3").innerHTML = metric
      ? `${Math.round(minHWSol_3)}<span>m/s</span>`
      : `${Math.round(minHWSol_3 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-min-sol3").innerHTML = minHWSol_3;
  }
  //wind direction
  const directionWDSol_3 = marsDataToDeploy[sol_3].WD.most_common
    ? marsDataToDeploy[sol_3].WD.most_common.compass_point
    : "N/A";
  document.getElementById("wd-sol3").innerHTML = directionWDSol_3;

  //Sol 4 flipping card
  //surface temperature
  const highSol_4 = Math.round(marsDataToDeploy[sol_4].AT.mx); //TEMP is always available because of previous check
  const lowSol_4 = Math.round(marsDataToDeploy[sol_4].AT.mn); //TEMP is always available because of previous check
  document.getElementById("at-high-sol4").innerHTML = metric
    ? `${Math.round(highSol_4)}<span>C</span>`
    : `${Math.round(highSol_4 * 1.8 + 32)}<span>F</span>`;
  document.getElementById("at-low-sol4").innerHTML = metric
    ? `${Math.round(lowSol_4)}<span>C</span>`
    : `${Math.round(lowSol_4 * 1.8 + 32)}<span>F</span>`;
  //surface preasure
  const maxPRSol_4 = marsDataToDeploy[sol_4].PRE
    ? Math.round(marsDataToDeploy[sol_4].PRE.mx)
    : "N/A";
  const minPRSol_4 = marsDataToDeploy[sol_4].PRE
    ? Math.round(marsDataToDeploy[sol_4].PRE.mn)
    : "N/A";
  if (typeof maxPRSol_4 === "number") {
    document.getElementById("pr-max-sol4").innerHTML = `${Math.round(
      maxPRSol_4
    )}<span>Pa</span>`;
  } else {
    document.getElementById("pr-max-sol4").innerHTML = maxPRSol_4;
  }
  if (typeof minPRSol_4 === "number") {
    document.getElementById("pr-min-sol4").innerHTML = `${Math.round(
      minPRSol_4
    )}<span>Pa</span>`;
  } else {
    document.getElementById("pr-min-sol4").innerHTML = minPRSol_4;
  }
  //horizontal wind
  const maxHWSol_4 = marsDataToDeploy[sol_4].HWS
    ? Math.round(marsDataToDeploy[sol_4].HWS.mx)
    : "N/A";
  const minHWSol_4 = marsDataToDeploy[sol_4].HWS
    ? Math.round(marsDataToDeploy[sol_4].HWS.mn)
    : "N/A";
  if (typeof maxHWSol_4 === "number") {
    document.getElementById("hw-max-sol4").innerHTML = metric
      ? `${Math.round(maxHWSol_4)}<span>m/s</span>`
      : `${Math.round(maxHWSol_4 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-max-sol4").innerHTML = maxHWSol_4;
  }
  if (typeof minHWSol_4 === "number") {
    document.getElementById("hw-min-sol4").innerHTML = metric
      ? `${Math.round(minHWSol_4)}<span>m/s</span>`
      : `${Math.round(minHWSol_4 * 2.37 + 32)}<span>mph</span>`;
  } else {
    document.getElementById("hw-min-sol4").innerHTML = minHWSol_4;
  }
  //wind direction
  const directionWDSol_4 = marsDataToDeploy[sol_4].WD.most_common
    ? marsDataToDeploy[sol_4].WD.most_common.compass_point
    : "N/A";
  document.getElementById("wd-sol4").innerHTML = directionWDSol_4;
  flipMarsCards();
  //bottom note
  const date = new Date(localStorage.latestMarsCheck);
  note.innerHTML = `<p>Updated: ${getShortDate(date)}
    <p>*N/A this data is not available right now.
    <p>
    <p>There is a weather station on Mars!!
    <p>This App shows the last 4 Sols (Martian days) with available temperature data.
    <p>
    <p>Mars weather data thanks to
    <p>NASA’s JPL InSight mission.
    <p>Go and click on the preferences button
    <p>for more cool info and links.
    <p>
    <p>* numbers rounded up at geek, not nerd, level.`;
  note.classList.remove("hide");
}

/*
 * @description Draws a wind-rose/compass of a given Sol using Plotly library
 * @param {object} data - Wind data to plot
 * @param {string} solNumber - Martian day that corresponds to wind data
 * based on Gemma Anible && Brian Carcich script example
 */
function windGraph(data, solNumber) {
  document.getElementById("sol-wd").innerHTML = `for Sol ${solNumber}`;
  const cpoints = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const values = new Array(16)
    .fill(0)
    .map((empty, index) => (data[index] ? data[index].ct : 0));
  const windRose = document.querySelector(".wind-graph");
  const dataToPlot = [
    {
      r: values,
      t: cpoints,
      name: "Sol",
      marker: { color: "#ef8618" },
      type: "area",
    },
  ];

  const layout = {
    autosize: false,
    showscale: false,
    width: 335,
    height: 335,
    font: { size: 16 },
    showlegend: false,
    legend: { font: { size: 0 } },
    radialaxis: { visible: false },
    orientation: 270,
  };

  Plotly.newPlot(windRose, dataToPlot, layout);
}

/*
 * @description Handles Martian day card rotation
 * @param {object} e - click event
 */
function fRotateCard(e) {
  if (actualPlanet === "earth") return;
  const pLength = e.composedPath().length - pathDayPosition;
  const dayId = e.composedPath()[pLength].id;
  const cardToRotate = document.getElementById(dayId);
  cardToRotate.querySelector(".front").classList.toggle("rotate");
  cardToRotate.querySelector(".back").classList.toggle("rotate");
}

/*
 * @desccription Animates Mars cards. UX just to show the user that cards can be flipped to get more weather info
 */
function flipMarsCards() {
  setTimeout(() => {
    document
      .getElementById("one")
      .querySelector(".front")
      .classList.toggle("rotate");
    document
      .getElementById("one")
      .querySelector(".back")
      .classList.toggle("rotate");
  }, 1000);
  setTimeout(() => {
    document
      .getElementById("two")
      .querySelector(".front")
      .classList.toggle("rotate");
    document
      .getElementById("two")
      .querySelector(".back")
      .classList.toggle("rotate");
  }, 1500);
  setTimeout(() => {
    document
      .getElementById("three")
      .querySelector(".front")
      .classList.toggle("rotate");
    document
      .getElementById("three")
      .querySelector(".back")
      .classList.toggle("rotate");
  }, 2000);
  setTimeout(() => {
    document
      .getElementById("one")
      .querySelector(".front")
      .classList.toggle("rotate");
    document
      .getElementById("one")
      .querySelector(".back")
      .classList.toggle("rotate");
    if (fab.classList.contains("open")) handleFABClick(); //close onboarding navigation
  }, 2500);
  setTimeout(() => {
    document
      .getElementById("two")
      .querySelector(".front")
      .classList.toggle("rotate");
    document
      .getElementById("two")
      .querySelector(".back")
      .classList.toggle("rotate");
  }, 3000);
  setTimeout(() => {
    document
      .getElementById("three")
      .querySelector(".front")
      .classList.toggle("rotate");
    document
      .getElementById("three")
      .querySelector(".back")
      .classList.toggle("rotate");
  }, 3500);
}

/* Planets whitout a weather station */
/*
 * @description Fills UI-cards with data for a planet without a weather station
 * @param {object} planetData - local stored quick facts for a planet
 * @param {boolean} metric - User's prefered unit. False if Fahrenheit
 */
function getGenericPlanetData(planetData, metric) {
  let value, symbol; //temp used for eassing innerHTML replacement
  //planet name, type and img
  const planetName = document.querySelector(
    ".generic-planet-container .container-header .title h1"
  );
  planetName.innerHTML = planetData.name.toUpperCase();
  const planetType = document.querySelector(
    ".generic-planet-container .place h2"
  );
  planetType.innerHTML = planetData.type;
  const planetImage = document.querySelector(
    ".generic-planet-container .planets-header .planet img"
  );
  planetImage.src = `./images/planet_${planetData.name}.svg`;
  //saturn or uranus uses a bigger image because of its rings
  if (planetData.name === "saturn" || planetData.name === "uranus") {
    planetImage.style.minWidth = "300px";
  } else {
    planetImage.style.minWidth = "200px";
  }
  //temperature
  //average temperatures
  const avTemp = document.querySelector(".generic-planet-container .avtemp");
  value = planetData.at;
  value = metric ? value : value * 1.8 + 32;
  symbol = metric ? "C" : "F";
  avTemp.innerHTML = `${Math.round(value)}<span>${symbol}</span>`;
  //your weight
  const yourHeight = document.querySelector(".body-weight .text-large");
  value = Math.round((localStorage.weight / 9.81) * planetData.gravity);
  symbol = metric ? "kgs" : "lbs";
  yourHeight.innerHTML = `${Math.round(
    value
  )}<span class='unit'>${symbol}</span>`;
  //distance from the Sun
  const distanceValue = document.querySelector(".distance-sun .text-large");
  value = metric
    ? planetData.distance
    : Math.round(planetData.distance / 1.609);
  symbol = metric ? "kms" : "miles";
  distanceValue.innerHTML = `${value}<span class='unit'>${symbol}</span>`;
  //day duration
  const dayDuration = document.querySelector(".day-duration .text-large");
  dayDuration.innerHTML = planetData.dayDuration;
  //year duration
  const yearDuration = document.querySelector(".year-duration .text-large");
  yearDuration.innerHTML = planetData.yearDuration;
  //bottom note
  note.innerHTML = `
    <p>No Weather Station available at the moment.
    <p>
    <p>* Compared to Earth's day and year duration.
    <p>
    <p>Planetary information thanks to<p>NASA’s Solar System Website:
    <p>go and check it out <a href="https://solarsystem.nasa.gov/planets/overview/#otp_planet_lineup" target="_blank">here</a>`;
}

/* Planet Earth */

/*
 * @description Checks if a day went by from the previous check
 */
function getEarthWeatherCheck() {
  const today = new Date();
  const latestCheck = new Date(localStorage.latestEarthCheck);
  // const updateInterval = 2.5; //to force update during debuging
  const updateInterval =
    (today.getTime() - latestCheck.getTime()) / (1000 * 3600 * 24);
  if (updateInterval > 1) {
    //time to check for new weather data
    updateEarthWeather();
  }
}

/*
 * @description Conects to OpenWeatherMap API to get the latest weather available
 */
function updateEarthWeather() {
  const location = JSON.parse(localStorage.getItem("location"));
  const lat = location.lat;
  const lon = location.lon;
  const url = `/earth/${lat},${lon}`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        title.innerHTML = "Earth";
        info.innerHTML = "ERROR conencting, using Latest Local Data";
        document
          .querySelector("#earth-load .circle-dot")
          .classList.remove("ok");
        document.querySelector("#earth-load .vert-bar").classList.remove("ok");
        document
          .querySelector("#earth-load .circle-dot")
          .classList.add("error");
        document.querySelector("#earth-load .vert-bar").classList.add("error");
        document.querySelector("#earth-load img").style.transform =
          "translateY(-50px)";
        document.querySelector("#earth-load .vert-bar").style.transform =
          "translateY(-50px)";
        notification(
          "Earth Error Connection",
          "There was a problem contacting the server. Using local data instead.",
          "warning"
        );
        const localData = JSON.parse(localStorage.getItem("earthweatherdata"));
        Object.assign(earthWeather, { ...localData });
      }
      return response.json();
    })
    .then((data) => {
      title.innerHTML = "Earth";
      info.innerHTML = "downlink OK, updating local data";
      document.querySelector("#earth-load .circle-dot").classList.add("ok");
      document.querySelector("#earth-load .vert-bar").classList.add("ok");
      updateLocalEarthData(data);
      deployEarthUIwithData();
    })
    .catch((error) => {
      notification(
        "Earth Error Connection",
        "There was a problem contacting the server. Using local data instead.",
        "warning"
      );
      document.querySelector("#earth-load .circle-dot").classList.remove("ok");
      document.querySelector("#earth-load .vert-bar").classList.remove("ok");
      document.querySelector("#earth-load .circle-dot").classList.add("error");
      document.querySelector("#earth-load .vert-bar").classList.add("error");
    });
}

/*
 * @description update localStorage with new weather data
 */
function updateLocalEarthData(data) {
  //store updated data to local storage
  localStorage.setItem("earthweatherdata", JSON.stringify(data));
  //update latest check Date to limit API request to once a day
  localStorage.latestEarthCheck = new Date();
  //update-sync object from where UI is build
  Object.assign(earthWeather, { ...data });
}

/*
 * @description Updates DOM elements with Earth weather
 */
function deployEarthUIwithData() {
  //get local storaged data
  const localEarthData = JSON.parse(localStorage.getItem("earthweatherdata"));
  Object.assign(earthWeather, { ...localEarthData });
  //get prefered units by user: true if Celsius
  const metric = localStorage.units === "C";
  const today = new Date(earthWeather.daily[0].dt * 1000);
  const day1 = new Date(earthWeather.daily[1].dt * 1000);
  const day2 = new Date(earthWeather.daily[2].dt * 1000);
  const day3 = new Date(earthWeather.daily[3].dt * 1000);
  //today's weather data
  const location = JSON.parse(localStorage.location);
  document.querySelector(".earth-container .location h2").innerHTML =
    localStorage.place;
  document.querySelector(
    ".earth-container .location h3"
  ).innerHTML = `Lat: ${location.lat} Lon: ${location.lon}`;
  document.querySelector(".earth-container .container-last-day h1").innerHTML =
    getStringDay(today);
  document.querySelector(
    ".earth-container .container-last-day h2"
  ).innerHTML = `${getStringMonth(
    today
  )} ${today.getDate()}, ${today.getFullYear()}`;
  //temperature
  document.getElementById("temp-today-mx").innerHTML = metric
    ? `${Math.round(earthWeather.daily[0].temp["max"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[0].temp["max"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("temp-today-mn").innerHTML = metric
    ? `${Math.round(earthWeather.daily[0].temp["min"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[0].temp["min"] * 1.8 + 32
      )}<span>F</span>`;
  //pressure
  document.getElementById("pr-today-mx").innerHTML = `${Math.round(
    earthWeather.daily[0].pressure
  )}<span>Pa</span>`;
  //wind
  document.getElementById("wd-today-mx").innerHTML = metric
    ? `${Math.round(earthWeather.daily[0].wind_speed)}<span>m/s</span>`
    : `${Math.round(
        earthWeather.daily[0].wind_speed * 2.37 + 32
      )}<span>mph</span>`;
  document.getElementById("wd-today-dir").innerHTML = getWindDirection(
    earthWeather.daily[0].wind_deg
  );
  document.getElementById("today-moon").src = `./images/moon_${moonPhase(
    today
  )}.svg`;
  //Three day forecast
  //day 1
  document.getElementById("day1-day").innerHTML = getStringDay(day1, false);
  document.getElementById("temp-day1-mx").innerHTML = metric
    ? `${Math.round(earthWeather.daily[1].temp["max"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[1].temp["max"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("temp-day1-mn").innerHTML = metric
    ? `${Math.round(earthWeather.daily[1].temp["min"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[1].temp["min"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("day1-moon").src = `./images/moon_${moonPhase(
    day1
  )}.svg`;
  //day 2
  document.getElementById("day2-day").innerHTML = getStringDay(day2, false);
  document.getElementById("temp-day2-mx").innerHTML = metric
    ? `${Math.round(earthWeather.daily[2].temp["max"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[2].temp["max"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("temp-day2-mn").innerHTML = metric
    ? `${Math.round(earthWeather.daily[2].temp["min"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[2].temp["min"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("day2-moon").src = `./images/moon_${moonPhase(
    day2
  )}.svg`;
  //day 3
  document.getElementById("day3-day").innerHTML = getStringDay(day3, false);
  document.getElementById("temp-day3-mx").innerHTML = metric
    ? `${Math.round(earthWeather.daily[3].temp["max"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[3].temp["max"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("temp-day3-mn").innerHTML = metric
    ? `${Math.round(earthWeather.daily[3].temp["min"])}<span>C</span>`
    : `${Math.round(
        earthWeather.daily[3].temp["min"] * 1.8 + 32
      )}<span>F</span>`;
  document.getElementById("day3-moon").src = `./images/moon_${moonPhase(
    day3
  )}.svg`;
  //bottom note
  const date = new Date(localStorage.latestEarthCheck);
  note.innerHTML = `
                    <p>
                    <p>Updated: ${getShortDate(date)}
                    <p>
                    <p>Earth weather forecast data thanks to Open Weather
                    <p>Moon phase as seen from southern hemisphere
                    <p>* numbers rounded up at geek, not nerd, level.`;
}

/* Navigation */

/*
 * @description Handles navigation when clicking the nav bar
 * @param {object} e - click event
 */
function handlePlanetClick(e) {
  const planetLength = e.composedPath().length - pathPlanet;
  const planet = e.composedPath()[planetLength].id;

  if (actualPlanet === planet) return; //clicked on same planet, no need to go on
  //update highlighted navbar button
  document.querySelector(`#${actualPlanet}`).classList.remove("active");
  document.querySelector(`#${planet}`).classList.add("active");
  // checking for planets with weather stations or the preference screen and hide if visible
  if (
    actualPlanet === "earth" ||
    actualPlanet === "mars" ||
    actualPlanet === "preferences"
  ) {
    const container = document.querySelector(`.${actualPlanet}-container`);
    container.classList.remove("show");
    container.classList.add("hide");
  }
  //checking if the click is on a planet with weather station or the preference screen and show if selected
  if (planet === "earth" || planet === "mars" || planet === "preferences") {
    note.innerHTML = "";
    if (planet === "mars") {
      deployMarsUIwithData();
    }
    if (planet === "earth") {
      deployEarthUIwithData();
    }
    const container = document.querySelector(`.${planet}-container`);
    container.classList.add("show");
    document
      .querySelector(".generic-planet-container")
      .classList.remove("show");
    document.querySelector(".generic-planet-container").classList.add("hide");
  } else {
    //show data for planets without a weather station
    const metric = localStorage.units === "C";
    const planetsData = JSON.parse(localStorage.getItem("planetsweatherdata"));
    const planetData = planetsData.filter((item) => item.name === planet)[0];
    getGenericPlanetData(planetData, metric);
    document.querySelector(".generic-planet-container").classList.add("show");
  }

  actualPlanet = planet;
  //go top of page for a better UX
  document.querySelector(".main-container").scrollTop = 0;
  if (fab.classList.contains("open")) handleFABClick(); //close onboarding navigation
}

/*
 * @description Add event listener to all nav bar buttons
 */
function navBarPlanetsClicInit() {
  navListPlanets.forEach((planet) => {
    planet.addEventListener("click", handlePlanetClick);
  });
}

/*
 * @description Handles drawer-like interaction for the nav bar
 */
function handleFABClick() {
  fab.classList.toggle("open");
  navBar.classList.toggle("open");
  handleElasticWave();
}

/*
 * @description Closes FAB - Nav Bar if opened and the click is not over the nav bar
 * @param {object} e - click event
 */
function closeFAB(e) {
  if (e.x > 100) {
    //not over the navbar
    if (fab.classList.contains("open")) handleFABClick();
  }
}

/* animations */

/*
 * @description Trigers Welcome Screen's loading animation
 */
//TODO: find a simple way to animate loading sequence... maybe use a library like lotie?
function loadDataSecuence() {
  //Mercury
  setTimeout(function () {
    title.innerHTML = "Mercury";
    info.innerHTML = "no weather station available";
    document.querySelector("#mercury-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#mercury-load .vert-bar").style.transform =
      "translateY(-100px)";
  }, 1000);
  setTimeout(function () {
    info.innerHTML = "using stadistical data";
    document.querySelector("#mercury-load img").style.transform =
      "translateY(-30px)";
    document.querySelector("#mercury-load .vert-bar").style.transform =
      "translateY(-30px)";
    document
      .querySelector("#mercury-load .circle-dot")
      .classList.add("warning");
    document.querySelector("#mercury-load .vert-bar").classList.add("warning");
  }, 2500);
  //Neptune
  setTimeout(function () {
    title.innerHTML = "Neptune";
    info.innerHTML = "no weather station available";
    document.querySelector("#neptune-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#neptune-load .vert-bar").style.transform =
      "translateY(-100px)";
    //Jupiter half up
    document.querySelector("#jupiter-load img").style.transform =
      "translateY(-50px)";
    document.querySelector("#jupiter-load .vert-bar").style.transform =
      "translateY(-50px)";
  }, 2600);
  //Jupiter up - Neptune down
  setTimeout(function () {
    title.innerHTML = "Neptune";
    info.innerHTML = "no weather station available";
    document.querySelector("#neptune-load img").style.transform =
      "translateY(-50px)";
    document.querySelector("#neptune-load .vert-bar").style.transform =
      "translateY(-50px)";
    document
      .querySelector("#neptune-load .circle-dot")
      .classList.add("warning");
    document.querySelector("#neptune-load .vert-bar").classList.add("warning");
  }, 3000);
  //Jupiter up
  setTimeout(function () {
    title.innerHTML = "Jupiter";
    info.innerHTML = "using stadistical data";
    document.querySelector("#jupiter-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#jupiter-load .vert-bar").style.transform =
      "translateY(-100px)";
  }, 3500);
  //Jupiter down
  setTimeout(function () {
    title.innerHTML = "Jupiter";
    info.innerHTML = "using stadistical data";
    document.querySelector("#jupiter-load img").style.transform =
      "translateY(-70px)";
    document.querySelector("#jupiter-load .vert-bar").style.transform =
      "translateY(-70px)";
    document
      .querySelector("#jupiter-load .circle-dot")
      .classList.add("warning");
    document.querySelector("#jupiter-load .vert-bar").classList.add("warning");
  }, 4000);
  //Uranus
  setTimeout(function () {
    title.innerHTML = "Uranus";
    info.innerHTML = "no weather station available";
    document.querySelector("#uranus-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#uranus-load .vert-bar").style.transform =
      "translateY(-100px)";
  }, 4500);
  //Venus
  setTimeout(function () {
    title.innerHTML = "Venus";
    info.innerHTML = "no weather station available";
    document.querySelector("#venus-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#venus-load .vert-bar").style.transform =
      "translateY(-100px)";
  }, 5000);
  //Venus - Uranus down - Saturn up
  setTimeout(function () {
    title.innerHTML = "Venus";
    info.innerHTML = "using stadistical data";
    document.querySelector("#venus-load img").style.transform =
      "translateY(-60px)";
    document.querySelector("#venus-load .vert-bar").style.transform =
      "translateY(-60px)";
    document.querySelector("#uranus-load img").style.transform =
      "translateY(-30px)";
    document.querySelector("#uranus-load .vert-bar").style.transform =
      "translateY(-30px)";
    document.querySelector("#saturn-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#saturn-load .vert-bar").style.transform =
      "translateY(-100px)";
    document.querySelector("#venus-load .circle-dot").classList.add("warning");
    document.querySelector("#venus-load .vert-bar").classList.add("warning");
    document.querySelector("#uranus-load .circle-dot").classList.add("warning");
    document.querySelector("#uranus-load .vert-bar").classList.add("warning");
  }, 5500);
  //Earth up - Uranus & Saturn down
  setTimeout(function () {
    title.innerHTML = "Saturn";
    info.innerHTML = "using stadistical data";
    document.querySelector("#venus-load img").style.transform =
      "translateY(-60px)";
    document.querySelector("#venus-load .vert-bar").style.transform =
      "translateY(-60px)";
    document.querySelector("#uranus-load img").style.transform =
      "translateY(-30px)";
    document.querySelector("#uranus-load .vert-bar").style.transform =
      "translateY(-30px)";
    document.querySelector("#saturn-load img").style.transform =
      "translateY(-40px)";
    document.querySelector("#saturn-load .vert-bar").style.transform =
      "translateY(-40px)";
    document.querySelector("#earth-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#earth-load .vert-bar").style.transform =
      "translateY(-100px)";
    document.querySelector("#saturn-load .circle-dot").classList.add("warning");
    document.querySelector("#saturn-load .vert-bar").classList.add("warning");
  }, 6000);
  //Earth text
  setTimeout(function () {
    title.innerHTML = "Earth";
    info.innerHTML = "contacting weather station";
    getEarthWeatherCheck();
  }, 6500);
  //Mars text
  setTimeout(function () {
    title.innerHTML = "Mars";
    info.innerHTML = "contacting weather station";
    document.querySelector("#mars-load img").style.transform =
      "translateY(-100px)";
    document.querySelector("#mars-load .vert-bar").style.transform =
      "translateY(-100px)";
    getMarsWeatherCheck();
  }, 7500);
  //silly nerd Text
  setTimeout(function () {
    title.innerHTML = "Alderaan";
    info.innerHTML = "404 NOT FOUND";
  }, 7000);
  //going to Mars screen
  setTimeout(function () {
    navBarPlanetsClicInit();
    actualPlanet = "mars";
    deployMarsUIwithData();
    document.querySelector(".loading-container").classList.remove("show");
    document.querySelector(".loading-container").classList.add("hide");
    document.querySelector(".mars-container").classList.add("show");
    document.querySelector(`#${actualPlanet}`).classList.add("active");
    handleFABClick();
    window.scrollTo(0, 1);
  }, 10000);
}

//set the nav bar background animation (uses tweenMax library)
timeLine.from("path#start", 1, {
  ease: Expo.easeInOut,
});
timeLine.to(
  "path#start",
  3,
  {
    attr: {
      d: "M80,1290H0V0H80C28,523,282,529,80,1290Z",
      d: "M80,1290H0V0H80C82,25,82,1236,80,1290Z",
    },
    ease: Elastic.easeOut,
  },
  "-=1"
);

/*
 * @description Restarts navigation bar's background animation
 */
function handleElasticWave() {
  timeLine.restart();
  elasticWave.classList.toggle("open");
}

/* utilities */

/*
 * @description Loads initial JSON default data
 * @param {string} planet - name of JSON to load
 */
//TODO: catch errors, older browsers
async function getDefaultData(planet) {
  const response = await fetch(`./data/${planet}.json`);
  const data = await response.json();
  localStorage.setItem(planet, JSON.stringify(data));
}

/*
 * @description Returns the name of month
 * @param {date} date - date to extract month's name
 * @param {boolean} short - format requested
 * @returns {string} name of month (ful name format by default)
 */
function getStringMonth(date, short) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return short ? months[date.getMonth()].substr(0, 3) : months[date.getMonth()];
}

/*
 * @description Returns the name of day
 * @param {date} date - date to extract day's name
 * @param {boolean} short - format requested
 * @returns {string} name of day (ful name format by default)
 */
function getStringDay(date, short) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return short ? days[date.getDay()].substr(0, 3) : days[date.getDay()];
}

/*
 * @description Returns a short formated date
 * @param {date} date - date to format
 * @returns {date} in MM/DD/YYYY format
 */
function getShortDate(date) {
  const dateOptions = {
    year: "numeric",
    month: "2-digit",
    day: "numeric",
  };
  return date.toLocaleDateString("en", dateOptions);
}

/*
 * @description Returns the cardinal name of a wind direction
 * @param {number} degrees - wind direction
 * @returns {string} cardinal name
 */
function getWindDirection(degrees) {
  const compass = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
    "N",
  ];
  const idx = Math.round((degrees % 360) / 22.5);
  return compass[idx];
}

/*
 * @description Closes a given modal
 * @param {object} modal - MouseEvent
 */
function closeModal(modal) {
  modal = modalWindCompass.parentElement;
  modal.classList.remove("open");
}

/*
 * @description Opens a given modal
 * @param {number} sol - Martian day number
 */
function openModal(sol) {
  const solNumber = marsWeather.sol_keys[sol];
  windGraph(marsWeather[solNumber].WD, solNumber);
  modal = modalWindCompass.parentElement;
  modal.classList.add("open");
}

/*
 * @description Animates bottom-up user notification
 * @param {string} title - Title for the notification
 * @param {string} text - Body for the notification
 * @param {string} type - possible value: Warning or normal by default
 */
function notification(title, text, type) {
  document.querySelector(".notification h1").innerHTML = title;
  document.querySelector(".notification p").innerHTML = text;
  const notification = document.querySelector(".notification");
  if (type === "warning") {
    notification.style.backgroundColor = "var(--bg-navbar-active)";
  } else {
    notification.style.backgroundColor = "var(--bg-navbar)";
  }
  notification.classList.remove("animate-notification");
  void notification.offsetWidth; //trick just to force to restart CCS animation
  notification.classList.add("animate-notification");
}

/*
 * @description Returns the name of the Earth's Moon phase
 * @param {date} date - Date to search corresponding phase
 * @returns {string}
 */
//TODO: simple algorithm... try a little more precise one
function moonPhase(date) {
  //phase range without decimals and shifted a little from reality to better show full and new moon more than one day
  const phases = [
    ["new", 0, 1],
    ["waxing_crescent", 1, 6],
    ["first_quarter", 6, 8],
    ["waxing_gibbous", 8, 13],
    ["full", 13, 15],
    ["waning_gibbous", 15, 21],
    ["last_quarter", 21, 23],
    ["waning_crescent", 23, 29],
    ["new", 29, 30],
  ];

  const lunarCycle = 2551443;
  const moonRefDate = new Date(1970, 0, 7, 20, 35, 0);
  const phase = ((date.getTime() - moonRefDate.getTime()) / 1000) % lunarCycle;
  const phaseInt = Math.floor(phase / (24 * 3600)) + 1;
  for (i = 0; i < 9; i++) {
    if (phaseInt >= phases[i][1] && phaseInt <= phases[i][2]) {
      const moonPhase = phases[i][0];
      return moonPhase;
    }
  }
}
