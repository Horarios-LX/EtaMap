import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.10.0/dist/maplibre-gl.mjs';

const infoContainer = document.getElementById('info');
infoContainer.style.display = 'none';

const map = new maplibregl.Map({
    container: 'map',

    style: 'https://tiles.openfreemap.org/styles/bright',

    center: [-9.1391, 38.71],
    zoom: 13,

    bearing: 0,

    attributionControl: false,

    missingStyleImageResolver: () => {
        return;
    }
});

let stops = null;
let stopsLoaded = false;


// Missing CCFL stops - pulled from TML GO
window.loadStops = (stopData) => {
    stops = stopData;
    stopsLoaded = true;

    if (!map.isStyleLoaded()) {
        console.log('Map not ready yet — stops saved.'); // pain
        return;
    }

    addStops();
};


function addStops() {

    if (!stopsLoaded || !stops) {
        return;
    }

    console.log(`Adding ${stops.length} stops to map`);

    // lets hope this doesnt get changed in the future lol
    const features = stops.map(stop => ({
        type: 'Feature',

        properties: {
            id: stop._id,
            name: stop.name,
            lines: stop.line_ids
        },

        geometry: {
            type: 'Point',

            coordinates: [
                Number(stop.longitude),
                Number(stop.latitude)
            ]
        }
    }));

    const geojson = {
        type: 'FeatureCollection',
        features
    };

    if (map.getSource('stops')) {
        map.getSource('stops').setData(geojson);
        return;
    }

    map.addSource('stops', {
        type: 'geojson',
        data: geojson
    });

    map.addLayer({
        id: 'stops',
        type: 'circle',
        source: 'stops',
        paint: {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 2,
                13, 4,
                16, 6
            ],
            'circle-color': '#2a5cdc',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
        }
    });

    map.addLayer({
        id: 'stop-hitbox',
        type: 'circle',
        source: 'stops',
        paint: {
            'circle-radius': 14,
            'circle-opacity': 0
        }
    });

    console.log('Stops added successfully.');
}

map.on('click', (event) => {

    const features = map.queryRenderedFeatures(
        event.point,
        {
            layers: ['stop-hitbox']
        }
    );


    if (!features || features.length === 0) {
        infoContainer.style.display = 'none';
        map.setFilter('stops', null);
        map.setFilter('stop-hitbox', null);
        return;
    }


    infoContainer.style.display = 'block';
    const stop = features[0];
    const stopId = stop.properties.id;
    const stopName = stop.properties.name;
    const lines = stop.properties.lines.map(z => "<span class='line long'>" + z + "</span>").join(" ");
    map.setFilter('stops', [
        '==',
        ['get', 'id'],
        stopId
    ]);

    map.setFilter('stop-hitbox', [
        '==',
        ['get', 'id'],
        stopId
    ]);

    window.moveMapToLatLon({ lat: stop.geometry.coordinates[1], lon: stop.geometry.coordinates[0] });

    document.getElementById('stopName').textContent = stopName;
    document.getElementById('stopId').textContent = "#" + stopId;
    document.getElementById('lines').innerHTML = lines;

    fetch("https://etas.doesmtr.eu/stops/" + stopId + "/etas").then(res => res.json()).then(data => {
        let depts = data.etas;
        let now = Date.now();
        let prevDepts = depts.filter(d => d.etaAt < now);
        let nextDepts = depts.filter(d => d.etaAt >= now);

        document.querySelector(".prevDept").innerHTML = prevDepts.map(d => {
            let time = new Date(d.etaAt);
            let timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `<div class="dept"><label class="dest"><span class="line long">${d.tripId.split("]")[2].split("_")[0]}</span> ${d.tripId} | Vec: ${d.vehicleId} | Stop #: ${d.stopSequence}</label><label class="arrivalTime">${timeStr}</label></div>`;
            /*
            <div class="dept">
                        <label class="dest"><span class="line long">1618</span> [183818388181] #13</label>
                        <label class="arrivalTime">12:00:00</label>
                    </div>
            */
        }).join("")

        document.querySelector(".nextDept").innerHTML = nextDepts.map(d => {
            let time = new Date(d.etaAt);
            let timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `<div class="dept"><label class="dest"><span class="line long">${d.tripId.split("]")[2].split("_")[0]}</span> ${d.tripId} | Vec: ${d.vehicleId} | Stop #: ${d.stopSequence}</label><label class="arrivalTime">${timeStr}</label></div>`;
            /*
            <div class="dept">
                        <label class="dest"><span class="line long">1618</span> [183818388181] #13</label>
                        <label class="arrivalTime">12:00:00</label>
                    </div>
            */
        }).join("")
    })
});

map.on('mouseenter', 'stop-hitbox', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'stop-hitbox', () => {
    map.getCanvas().style.cursor = '';
});

map.on('style.load', () => {

    console.log('Map loaded!');

    setTimeout(() => {
        addStops(); // temporary solution:tm:
    }, 1000);
});

window.moveMapToLatLon = (pos) => {
    map.easeTo({
        center: [
            pos.lon,
            pos.lat
        ],
        zoom: 16,
        duration: 500
    });
};