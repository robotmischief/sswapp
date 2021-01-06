## **SSWAPP**
### **S**olar **S**ystem **W**eather **A**pp
A Weather Forecast for the Space Traveler

![sswapp loading](images/readme/loading.png)

---
## Mars Weather
NASA’s InSight Mars lander takes continuous weather measurements (temperature, wind, pressure) on the surface of Mars at Elysium Planitia, a flat, smooth plain near Mars’ equator.

To learn a lot more about this cool mission check [this link](https://mars.nasa.gov/insight/timeline/overview/)

This App shows weather data for the latest 4 Sols (Martian days) *with available temperature data*. As the data has to travel from Mars to Earth (!) sometimes it is incomplete or unavailable but when more data from a particular Sol are downlinked (sometimes several days later), these values are recalculated, and consequently may change as more data are received on Earth.

The InSight Mars Mission data is provided by the NASA Jet Propulsion Laboratory and Cornell University API.

![mars screen](images/readme/mars.png) 

---
## Earth Weather
Earth weather forecast data thanks to Open Weather API. Go and check them out at [Open Weather Map](https://www.openweathermap.org)

![earth screen](images/readme/earth.png)

### :point_up_2: Changing Earth location
Click the preference button to select a different place to get its weather.

---
## Preferences
On this screen you can change:
* Your nickname
* Unit preference (Celsius or Fahrenheit)
* Your weight on Earth (used to calculate it on other planets)
* Place to get the weather

![preferences screen](images/readme/preferences.png)

---
## Planetary Data</h3>
Planetary information thanks to NASA’s Solar System Website: go and check it out to learn tons of cool stuff about our [solar system](https://solarsystem.nasa.gov/planets/overview/#otp_planet_lineup)

![planet screen](images/readme/planets.png)

---
## Web Service Rate Limits
As all these cool APIs are free to use, limits are placed on the number of requests you can make. To keep these requests as low as possible, SSWAPP updates weather data on a daily basis.

