// --- Global Elements ---
const messageBox = document.getElementById('messageBox');
const messageTitle = document.getElementById('messageTitle');
const messageText = document.getElementById('messageText');
const closeButton = document.getElementById('closeBtn');
const sosMapDiv = document.getElementById('sosMap');

// --- General Message Function ---
function showMessage(title, text) {
    messageTitle.innerText = title;
    messageText.innerText = text;
    // Ensure map is hidden and text is shown for general messages
    sosMapDiv.classList.add('hidden');
    messageText.classList.remove('hidden');
    messageBox.classList.remove('hidden');
}

closeButton.addEventListener('click', () => {
    messageBox.classList.add('hidden');
});

// --- SOS Button Functionality ---
const sosButton = document.getElementById('sosBtn');
sosButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPositionOnMap, showError);
    } else {
        showMessage("SOS Alert", "Sorry, Geolocation is not supported by your browser.");
    }
});

function showPositionOnMap(position) {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        // Fallback to text if maps not loaded
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const message = `Google Maps failed to load. Your location is:\n\nLatitude: ${lat.toFixed(4)}\nLongitude: ${lon.toFixed(4)}`;
        showMessage("SOS Alert", message);
        return;
    }

    const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };

    // Prepare the message box for the map
    messageTitle.innerText = "SOS Alert: Your Location";
    messageText.classList.add('hidden');
    sosMapDiv.classList.remove('hidden');
    messageBox.classList.remove('hidden');

    // Create and display the map
    const sosMap = new google.maps.Map(sosMapDiv, {
        center: userLocation,
        zoom: 16, // Zoom in closer for SOS
    });

    // Add a prominent marker
    new google.maps.Marker({
        position: userLocation,
        map: sosMap,
        title: "Your Current Location",
        animation: google.maps.Animation.DROP,
    });
    
    // It's good practice to resize the map when the modal becomes visible
    setTimeout(() => {
        google.maps.event.trigger(sosMap, 'resize');
        sosMap.setCenter(userLocation);
    }, 100); // Small delay to ensure modal is fully visible
}

function showError(error) {
    let errorMessage = "An error occurred.";
    switch(error.code) {
        case error.PERMISSION_DENIED: errorMessage = "Aapne location access ki anumati nahi di. Kripya suraksha ke liye isse anumati dein."; break;
        case error.POSITION_UNAVAILABLE: errorMessage = "Aapki location ki jaankari uplabdh nahi hai."; break;
        case error.TIMEOUT: errorMessage = "Location anurodh time out ho gaya."; break;
        case error.UNKNOWN_ERROR: errorMessage = "Ek anjaan error hua."; break;
    }
    showMessage("SOS Error", errorMessage);
}

// --- Safe Zone Locator Functionality ---
const findSafeZonesBtn = document.getElementById('findSafeZonesBtn');
const mapDiv = document.getElementById('map');
let map; 

function initMap() {
    // This function is called by the API script, it can be empty if we initialize maps on demand
}

findSafeZonesBtn.addEventListener('click', () => {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        mapDiv.classList.remove('hidden');
        mapDiv.innerHTML = `<div class='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4 text-left' role='alert'><p class='font-bold'>Map Error</p><p>Google Maps load nahi ho saka. Aisa lagta hai ki API Key aamany (invalid) ya gayab hai.</p><p class='mt-2 text-sm'>Kripya code mein placeholder key ko apni asli Google Maps API key se badlein.</p></div>`;
        findSafeZonesBtn.innerText = "Error Loading Map";
        findSafeZonesBtn.disabled = true;
        return;
    }

    // Initialize map if not already done
    if (!map) {
         const bhopal = { lat: 23.2599, lng: 77.4126 };
         map = new google.maps.Map(mapDiv, { center: bhopal, zoom: 12 });
    }

    mapDiv.classList.remove('hidden');
    findSafeZonesBtn.innerText = "Loading Map...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showUserAndSafeZones, (error) => {
            showError(error);
            findSafeZonesBtn.innerText = "Find Safe Zones Near Me";
        });
    } else {
        showMessage("Map Error", "Geolocation is not supported by this browser.");
        findSafeZonesBtn.innerText = "Find Safe Zones Near Me";
    }
});

function showUserAndSafeZones(position) {
    const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    map.setCenter(userLocation);
    map.setZoom(14);
    google.maps.event.trigger(map, 'resize');
    map.setCenter(userLocation);
    new google.maps.Marker({ position: userLocation, map: map, title: "Your Location", icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff" } });
    const safeZones = [
        { lat: 23.2381, lng: 77.4344, name: "MP Nagar Police Station", type: "Police" },
        { lat: 23.2797, lng: 77.4035, name: "Hamidia Hospital", type: "Hospital" },
        { lat: 23.2547, lng: 77.3919, name: "Jahangirabad Police Station", type: "Police" },
        { lat: 23.2188, lng: 77.4024, name: "AIIMS Bhopal", type: "Hospital" }
    ];
    safeZones.forEach(zone => {
        new google.maps.Marker({ position: zone, map: map, title: `${zone.name} (${zone.type})`, icon: zone.type === 'Police' ? 'https://maps.google.com/mapfiles/ms/icons/police.png' : 'https://maps.google.com/mapfiles/ms/icons/hospitals.png' });
    });
    findSafeZonesBtn.innerText = "Map Loaded!";
}

// --- Journey Tracker Functionality ---
const startJourneyBtn = document.getElementById('startJourneyBtn');
const stopJourneyBtn = document.getElementById('stopJourneyBtn');
const journeyStatus = document.getElementById('journeyStatus');
let watchId = null; 

startJourneyBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                journeyStatus.innerHTML = `Journey Active. Last updated location:<br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
            }, 
            (error) => {
                showError(error);
                startJourneyBtn.disabled = false;
                stopJourneyBtn.disabled = true;
                journeyStatus.innerHTML = "Could not start journey. Please allow location access.";
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
        startJourneyBtn.disabled = true;
        stopJourneyBtn.disabled = false;
        const trackingId = Math.random().toString(36).substring(2, 8);
        journeyStatus.innerHTML = `Journey Started! Share this tracking link (demo):<br><b class="text-indigo-600">suraksha.sakhi/track/${trackingId}</b>`;
        showMessage("Journey Started", "Live location tracking is now active.");
    } else {
        showMessage("Journey Error", "Geolocation is not supported by your browser.");
    }
});

stopJourneyBtn.addEventListener('click', () => {
    stopJourney();
});

function stopJourney() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        startJourneyBtn.disabled = false;
        stopJourneyBtn.disabled = true;
        journeyStatus.innerHTML = "Journey ended. Tracking is off.";
        showMessage("Journey Ended", "Live location tracking has been stopped.");
    }
}

// --- Anonymous Reporting Form Functionality (Updated for Backend) ---
const reportForm = document.getElementById('reportForm');

reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const incidentType = document.getElementById('incident-type').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;

    if (description.trim() === '' || location.trim() === '') {
        showMessage("Validation Error", "Kripya ghatna ka sthan (location) aur vivaran (description) anivarya roop se bharein.");
        return;
    }

    // Data ko backend par bhejne ke liye object taiyaar karo
    const reportData = {
        incidentType: incidentType,
        location: location,
        description: description
    };

    try {
        // 'fetch' API ka istemal karke server ke '/api/report' endpoint par POST request bhejo
        const response = await fetch('/api/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData),
        });

        const result = await response.json();

        if (response.ok) {
            // Agar server se success response aaye
            showMessage("Report Submitted", "Aapki report safaltapoorvak darj kar li gayi hai. Dhanyavaad.");
            reportForm.reset();
        } else {
            // Agar server se error response aaye
            showMessage("Submission Error", `Report darj nahi ho saki. Server ne kaha: ${result.message}`);
        }
    } catch (error) {
        // Agar network ya koi aur error ho
        console.error('Fetch Error:', error);
        showMessage("Network Error", "Server se sampark nahi ho pa raha hai. Kripya apni internet connectivity check karein.");
    }
});
