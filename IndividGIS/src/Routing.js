class RouteController {
    constructor(map) {
        this.map = map;
        this.routeLayer = L.layerGroup().addTo(map);
        this.markersLayer = L.layerGroup().addTo(map);
        this.activeInput = null;
        this.fromCoords = null;
        this.toCoords = null;
        this.viaCoords = [];
        this.routingControl = null;
        this.initElements();
        this.initEvents();
        this.initRoutingControl();
    }

    initElements() {
        this.routeFrom = document.getElementById('routeFrom');
        this.routeTo = document.getElementById('routeTo');
        this.routeInfo = document.getElementById('routeInfo');
        this.routeSummary = document.getElementById('routeSummary');
        this.routeSteps = document.getElementById('routeSteps');
        this.calculateBtn = document.getElementById('calculateRoute');
        this.viaPointsContainer = document.getElementById('viaPoints');
        this.addViaBtn = document.getElementById('addViaPoint');
        
        // Удалено: picker кнопки (не нужны, координаты можно вводить через coord-button)
    }

    initRoutingControl() {
        this.routingControl = L.Routing.control({
            waypoints: [],
            language: 'ru',
            geocoder: L.Control.Geocoder.nominatim(),
            router: L.Routing.mapbox('pk.eyJ1IjoibWFseXNoIiwiYSI6ImNqaTh6bW14djBybW0zcXBia2sxcDF5cWsifQ.Dc0hXPv2Vsf-upW7xxQ-_w', {
                language: 'ru',
            }),
            showAlternatives: true,
            reverseWaypoints: true,
            altLineOptions: {
                styles: [
                    {color: '#38761d', opacity: 0.75, weight: 5}
                ]
            },
            addToMap: false // Мы будем добавлять его вручную
        });

        // Обработчик изменения маршрута
        this.routingControl.on('routesfound', (e) => {
            const routes = e.routes;
            this.displayRouteInfo(routes[0]);
        });
    }

    // Удалено: функции picker кнопок (заменены на coord-button функциональность)

    initEvents() {
        this.calculateBtn.addEventListener('click', () => this.calculateRoute());
        
        // Убрано: обработка кликов на карте для picker кнопок (не нужно)

        // Убрано: focus события для activeInput (не нужны без picker кнопок)

        this.addViaBtn.addEventListener('click', () => {
            this.addViaPoint();
        });
    }

    setPoint(type, coords, displayName = '') {
        if (type === 'from') {
            this.fromCoords = coords;
            this.routeFrom.value = displayName || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            this.updateRoute();
        } else if (type === 'to') {
            this.toCoords = coords;
            this.routeTo.value = displayName || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            this.updateRoute();
        }
    }

    async setPointFromMap(latlng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
            const data = await response.json();
            const address = data.display_name || `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            
            if (this.activeInput === 'from') {
                this.setPoint('from', latlng, address);
            } else if (this.activeInput === 'to') {
                this.setPoint('to', latlng, address);
            } else if (typeof this.activeInput === 'number') {
                this.viaCoords[this.activeInput].coords = latlng;
                this.viaCoords[this.activeInput].input.value = address;
                this.updateRoute();
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
            const coordsStr = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            
            if (this.activeInput === 'from') {
                this.setPoint('from', latlng, coordsStr);
            } else if (this.activeInput === 'to') {
                this.setPoint('to', latlng, coordsStr);
            } else if (typeof this.activeInput === 'number') {
                this.viaCoords[this.activeInput].coords = latlng;
                this.viaCoords[this.activeInput].input.value = coordsStr;
                this.updateRoute();
            }
        }
    }

    addViaPoint() {
        const viaIndex = this.viaCoords.length;
        
        const viaPointDiv = document.createElement('div');
        viaPointDiv.className = 'via-point';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Промежуточная точка или клик на карте';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-via';
        removeBtn.textContent = '×';
        
        viaPointDiv.appendChild(input);
        viaPointDiv.appendChild(removeBtn);
        
        this.addViaBtn.parentNode.insertBefore(viaPointDiv, this.addViaBtn);
        
        this.viaCoords.push({
            coords: null,
            input: input,
            div: viaPointDiv
        });
        
        // Убрано: события для picker кнопок via точек
        
        removeBtn.addEventListener('click', () => {
            this.removeViaPoint(viaIndex);
        });
    }

    removeViaPoint(index) {
        if (index >= 0 && index < this.viaCoords.length) {
            this.viaCoords[index].div.remove();
            this.viaCoords.splice(index, 1);
            this.updateRoute();
            
            this.viaCoords.forEach((point, i) => {
                point.input.onfocus = () => { this.activeInput = i; };
            });
        }
    }

    updateRoute() {
        // Очищаем предыдущий маршрут
        this.routeLayer.clearLayers();
        
        // Подготавливаем точки маршрута
        const waypoints = [];
        
        if (this.fromCoords) {
            waypoints.push(L.latLng(this.fromCoords.lat, this.fromCoords.lng));
        }
        
        this.viaCoords.forEach(via => {
            if (via.coords) {
                waypoints.push(L.latLng(via.coords.lat, via.coords.lng));
            }
        });
        
        if (this.toCoords) {
            waypoints.push(L.latLng(this.toCoords.lat, this.toCoords.lng));
        }
        
        // Устанавливаем точки маршрута
        if (waypoints.length >= 2) {
            this.routingControl.setWaypoints(waypoints);
            
            // Если routingControl еще не добавлен на карту, добавляем его
            if (!this.map.hasLayer(this.routingControl.getPlan())) {
                this.routingControl.addTo(this.map);
            }
            
            // Рассчитываем маршрут
            this.routingControl.route();
        } else {
            // Если точек недостаточно, удаляем routingControl с карты
            if (this.map.hasLayer(this.routingControl.getPlan())) {
                this.map.removeControl(this.routingControl);
            }
        }
    }

    displayRouteInfo(route) {
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const duration = Math.round(route.summary.totalTime / 60);
        
        let summaryHTML = `
            <h4>Информация о маршруте:</h4>
            <p><strong>Общее расстояние:</strong> ${distance} км</p>
            <p><strong>Примерное время:</strong> ${duration} мин</p>
            <h5>Инструкции по маршруту:</h5>
        `;
        
        let stepsHTML = '';
        
        route.instructions.forEach(instruction => {
            const stepDistance = (instruction.distance / 1000).toFixed(1);
            stepsHTML += `
                <div class="route-step">
                    <div class="instruction">${instruction.text}</div>
                    <div class="distance">${stepDistance} км</div>
                </div>
            `;
        });
        
        this.routeSummary.innerHTML = summaryHTML;
        this.routeSteps.innerHTML = stepsHTML;

        // Масштабирование карты
        const bounds = L.latLngBounds(
            route.coordinates.map(coord => L.latLng(coord.lat, coord.lng))
        );
        if (bounds.isValid()) {
            this.map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 15
            });
        }
    }

    calculateRoute() {
        if (!this.fromCoords || !this.toCoords) {
            this.routeInfo.innerHTML = '<p>Укажите точки отправления и назначения</p>';
            return;
        }

        this.routeInfo.innerHTML = '<p>Построение маршрута...</p>';
        this.updateRoute();
    }
}