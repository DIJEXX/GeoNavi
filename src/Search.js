class SearchController {
    constructor(map) {
        this.map = map;
        this.currentRadius = 5;
        this.marker = null;
        this.selectedPlace = null;
        this.searchResults = [];
        this.initElements();
        this.initEvents();
    }

    initElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResultsDiv = document.getElementById('searchResults');
        this.placeInfo = document.getElementById('placeInfo');
        this.placeName = document.getElementById('placeName');
        this.placeAddress = document.getElementById('placeAddress');
        this.placeCoords = document.getElementById('placeCoords');
        this.radiusInput = document.getElementById('radiusInput');
        this.backToResultsBtn = document.getElementById('backToResults');
    }

    initEvents() {
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
                document.getElementById('sidePanel').classList.add('open');
                document.getElementById('expandBtn').textContent = '×';
                this.map.invalidateSize();
            }
        });

        this.radiusInput.addEventListener('change', () => {
            this.currentRadius = parseInt(this.radiusInput.value);
            if (this.searchInput.value.trim()) this.performSearch();
        });

        this.backToResultsBtn.addEventListener('click', () => {
            this.showResults();
        });

        document.getElementById('copyCoords').addEventListener('click', () => {
            navigator.clipboard.writeText(this.placeCoords.textContent)
                .then(() => alert('Координаты скопированы!'))
                .catch(() => alert('Не удалось скопировать координаты'));
        });

        document.getElementById('addToRouteFrom').addEventListener('click', () => {
            this.addToRouting('from');
        });

        document.getElementById('addToRouteTo').addEventListener('click', () => {
            this.addToRouting('to');
        });
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (query.length < 2) return;

        this.showLoading(true);
        
        try {
            const url = new URL('https://nominatim.openstreetmap.org/search');
            url.searchParams.set('format', 'json');
            url.searchParams.set('q', query);
            url.searchParams.set('limit', '10');
            url.searchParams.set('addressdetails', '1');
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка сети');
            
            let results = await response.json();
            
            if (this.currentRadius > 0) {
                const center = this.map.getCenter();
                results = results.filter(item => {
                    const distance = this.calculateDistance(
                        center.lat, center.lng,
                        parseFloat(item.lat), parseFloat(item.lon)
                    );
                    return distance <= this.currentRadius;
                });
                
                results.sort((a, b) => {
                    const distA = this.calculateDistance(
                        center.lat, center.lng,
                        parseFloat(a.lat), parseFloat(a.lon)
                    );
                    const distB = this.calculateDistance(
                        center.lat, center.lng,
                        parseFloat(b.lat), parseFloat(b.lon)
                    );
                    return distA - distB;
                });
            }
            
            this.searchResults = results;
            this.displayResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.searchResultsDiv.innerHTML = '<p>Ошибка при выполнении поиска. Попробуйте другой запрос.</p>';
        } finally {
            this.showLoading(false);
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    displayResults(results) {
        this.searchResultsDiv.innerHTML = '';
        
        if (!results || results.length === 0) {
            this.searchResultsDiv.innerHTML = '<p>Ничего не найдено в выбранном радиусе</p>';
            return;
        }
        
        results.forEach(result => {
            const distance = this.calculateDistance(
                this.map.getCenter().lat, this.map.getCenter().lng,
                parseFloat(result.lat), parseFloat(result.lon)
            ).toFixed(1);
            
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <strong>${result.display_name.split(',')[0]}</strong>
                <div class="result-details">
                    <small>${result.display_name.split(',').slice(1, 3).join(', ').trim()}</small>
                    <span class="distance-badge">${distance} км</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.showPlace(result);
            });
            
            this.searchResultsDiv.appendChild(item);
        });
    }

    showPlace(place) {
        if (!place) return;
        
        this.selectedPlace = place;
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        this.placeName.textContent = place.display_name.split(',')[0] || 'Неизвестное место';
        this.placeAddress.textContent = place.display_name.split(',').slice(1).join(', ').trim() || 'Адрес не указан';
        this.placeCoords.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        
        if (this.marker) this.map.removeLayer(this.marker);
        this.marker = L.marker([lat, lon], {
            title: place.display_name
        }).addTo(this.map)
            .bindPopup(place.display_name);
        
        this.map.flyTo([lat, lon], 15, {
            duration: 1
        });

        this.searchResultsDiv.style.display = 'none';
        this.placeInfo.style.display = 'block';
    }

    showResults() {
        this.placeInfo.style.display = 'none';
        this.searchResultsDiv.style.display = 'block';
    }

    addToRouting(type) {
        if (!this.selectedPlace) return;
        
        document.querySelector('.tab-btn[data-tab="routing"]').click();
        
        const coords = L.latLng(this.selectedPlace.lat, this.selectedPlace.lon);
        
        if (type === 'from') {
            document.getElementById('routeFrom').value = this.selectedPlace.display_name;
            window.routeController.setPoint('from', coords, this.selectedPlace.display_name);
        } else {
            document.getElementById('routeTo').value = this.selectedPlace.display_name;
            window.routeController.setPoint('to', coords, this.selectedPlace.display_name);
        }
    }

    showLoading(show) {
        if (show) {
            this.searchResultsDiv.innerHTML = '<p>Поиск...</p>';
        }
    }
}