// Themes.js
class ThemesController {
    constructor(map) {
        this.map = map;
        this.markersLayer = L.layerGroup().addTo(map);
        this.customThemes = [];
        this.initThemes();
    }

    initThemes() {
        this.baseThemes = [
            {
                name: "Полицейские участки",
                query: "amenity=police",
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            },
            {
                name: "Больницы",
                query: "amenity=hospital",
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            },
            {
                name: "Почтовые отделения",
                query: "amenity=post_office",
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }
        ];
    }

    async loadTheme(theme, radius = 5) {
        this.markersLayer.clearLayers();
        const center = this.map.getCenter();
        
        try {
            const response = await fetch(`https://overpass-api.de/api/interpreter?data=[out:json];node[${theme.query}](around:${radius*1000},${center.lat},${center.lng});out;`);
            const data = await response.json();
            
            data.elements.forEach(element => {
                if (element.lat && element.lon) {
                    const marker = L.marker([element.lat, element.lon], {
                        icon: theme.icon
                    }).addTo(this.markersLayer);
                    
                    if (element.tags && element.tags.name) {
                        marker.bindPopup(`<b>${element.tags.name}</b><br>${theme.name}`);
                    } else {
                        marker.bindPopup(`<b>${theme.name}</b>`);
                    }
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error loading theme:', error);
            return false;
        }
    }

    addCustomTheme(name, geojson) {
        const newTheme = {
            name: name,
            geojson: geojson,
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            })
        };
        
        this.customThemes.push(newTheme);
        return newTheme;
    }

    loadCustomTheme(theme) {
        this.markersLayer.clearLayers();
        
        try {
            const geojsonLayer = L.geoJSON(theme.geojson, {
                pointToLayer: (feature, latlng) => {
                    return L.marker(latlng, {
                        icon: theme.icon
                    }).bindPopup(`<b>${feature.properties.name || theme.name}</b>`);
                }
            }).addTo(this.markersLayer);
            
            return true;
        } catch (error) {
            console.error('Error loading custom theme:', error);
            return false;
        }
    }
}