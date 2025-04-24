let map;
let geocoder;
let placesService;
let autocompleteA, autocompleteB;
let midpoint; // ⬅️ Store midpoint globally
let markers = [];
let midpointMarkers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 8,
  });

  geocoder = new google.maps.Geocoder();
  placesService = new google.maps.places.PlacesService(map);

  autocompleteA = new google.maps.places.Autocomplete(
    document.getElementById("locationA")
  );
  autocompleteB = new google.maps.places.Autocomplete(
    document.getElementById("locationB")
  );
}

function findMidpoint() {
  const addressA = document.getElementById("locationA").value;
  const addressB = document.getElementById("locationB").value;

  console.log("Address A:", addressA);
  console.log("Address B:", addressB);

  // Remove all previous markers before starting a new search
  clearMarkers();

  geocoder.geocode({ address: addressA }, (resultsA, statusA) => {
    if (statusA === "OK") {
      geocoder.geocode({ address: addressB }, (resultsB, statusB) => {
        if (statusB === "OK") {
          const locA = resultsA[0].geometry.location;
          const locB = resultsB[0].geometry.location;

          const midLat = (locA.lat() + locB.lat()) / 2;
          const midLng = (locA.lng() + locB.lng()) / 2;

          midpoint = new google.maps.LatLng(midLat, midLng);

          map.setCenter(midpoint);
          map.setZoom(12);

          // 🔴 Marker for Location A
          const markerA = new google.maps.Marker({
                position: locA,
                map: map,
                title: "Location A",
                icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            });
            markers.push(markerA);

            // 🟢 Marker for Location B
            const markerB = new google.maps.Marker({
                position: locB,
                map: map,
                title: "Location B",
                icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            });
            markers.push(markerB);

            // 🔵 Marker for Midpoint
            const markerMid = new google.maps.Marker({
                position: midpoint,
                map: map,
                title: "Midpoint",
                icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            });  
            markers.push(markerMid);

            // 📍 Reverse geocode and update markers' tooltips with address
          geocoder.geocode({ location: locA }, (results, status) => {
            if (status === "OK" && results[0]) {
              markerA.setTitle(results[0].formatted_address);
            }
          });

          geocoder.geocode({ location: locB }, (results, status) => {
            if (status === "OK" && results[0]) {
              markerB.setTitle(results[0].formatted_address);
            }
          });

           // 📍 Reverse geocode midpoint to get human-readable location
           geocoder.geocode({ location: midpoint }, (results, status) => {
            if (status === "OK" && results[0]) {
              markerMid.setTitle(results[0].formatted_address);
              document.getElementById("midpointAddress").innerText =
                "📍 Meet in the middle at: " + results[0].formatted_address;
            } else {
              document.getElementById("midpointAddress").innerText =
                "Could not find address for midpoint.";
            }
          });  

          markerMid.addListener("click", () => {
            const mapsUrl = `https://www.google.com/maps?q=${midLat},${midLng}`;
            window.open(mapsUrl, "_blank");
          });

          // ✅ Show travel time from both locations
          const service = new google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: [locA, locB],
              destinations: [midpoint],
              travelMode: google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC
            },
            (response, status) => {
              if (status !== "OK") {
                console.error("Distance Matrix error:", status);
                return;
              }

              const output = `
                <h3 class="travelTime"> Travel Time to Midpoint:</h3>
                <ul>
                  <li>From Location A: ${response.rows[0].elements[0].duration.text} (${response.rows[0].elements[0].distance.text})</li>
                  <li>From Location B: ${response.rows[1].elements[0].duration.text} (${response.rows[1].elements[0].distance.text})</li>
                </ul>
              `;
              document.getElementById("travelInfo").innerHTML = output;
            }
          );

         // Enable the "Find Cafes" button
         const findCafesBtn = document.getElementById("cafesBtn");
         findCafesBtn.disabled = false; // Enable the button
         findCafesBtn.style.backgroundColor = "#4CAF50"; // Set to green or any color
         findCafesBtn.style.cursor = "pointer"; // Allow clicking
        } else {
            alert("Please enter a valid address for Location B  " + statusB);
            return;
        }
      });
    } else {
        alert("Please enter a valid address for Location A  " + statusA);
        return;
    }
  });
}

function findCafes() {
  //console.log(midpoint);

  clearMidpointMarkers();

  if (!midpoint || !midpoint.lat || !midpoint.lng) {
      alert("Midpoint is invalid or not set.");
      return;
    }

  // Extract lat and lng from google.maps.LatLng object
  const lat = midpoint.lat();
  const lng = midpoint.lng();  
  //console.log("Midpoint coordinates:", lat, lng);

  // Check if placesService is initialized
  if (!placesService) {
    console.error("Places service is not initialized");
    alert("Google Places service is not available. Please refresh the page.");
    return;
  }
    
  const radiusKm = parseInt(document.getElementById("radiusSelect").value);

  const request = {
    location: midpoint,
    radius: radiusKm,
    type: "restaurant" 
  };

  console.log(request);

  try {
    // console.log("Calling nearbySearch...");
    placesService.nearbySearch(request, (results, status) => {
      // console.log("Search callback received with status:", status);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // console.log("Cafes found:", results);

        results.forEach(place => {
          const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
          });
          markers.push(marker);
          midpointMarkers.push(marker);

          marker.setTitle(`${place.name} - ${place.vicinity || ''}`);
        
          const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
        
          marker.addListener("click", () => {
            window.open(mapsUrl, "_blank");
          });
        });

      } else {
        console.log("No cafes found or error:", status);
        alert("No cafes found near the midpoint.");
      }
    });
  } catch (error) {
      console.error("Error executing nearbySearch:", error);
      alert("An error occurred while searching for places: " + error.message);
  }
}

// Function to clear all markers from the map
function clearMarkers() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null); // Remove each marker from the map
  }
  markers = []; // Clear the array of markers
}

// Function to clear only midpoint markers from the map
function clearMidpointMarkers() {
  for (let i = 0; i < midpointMarkers.length; i++) {
    midpointMarkers[i].setMap(null); // Remove each marker from the map
  }
  midpointMarkers = []; // Clear the array of markers
}

function refreshPage() {
  location.reload(); // This will reload the page when the button is clicked
}

window.initMap = initMap;

