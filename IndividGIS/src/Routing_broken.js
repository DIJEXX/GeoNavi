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
        this.isPickingPoint = false;
        
        this.initElements();
        this.initEvents();
        this.initMapClickHandler();
        
        console.log('✅ RouteController инициализирован');
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
        
        // Создаем кнопки выбора точек
        this.createPickerButtons();
        
        console.log('✅ Элементы интерфейса инициализированы');
    }

    createPickerButtons() {
        // Обертываем input'ы в контейнеры с кнопками
        this.wrapInputWithPicker(this.routeFrom, 'from', '🚀 Выбрать начальную точку на карте');
        this.wrapInputWithPicker(this.routeTo, 'to', '🏁 Выбрать конечную точку на карте');
    }

    wrapInputWithPicker(input, type, title) {
        // Создаем контейнер
        const container = document.createElement('div');
        container.className = 'route-input-container';
        
        // Вставляем контейнер вместо input
        input.parentNode.insertBefore(container, input);
        
        // Перемещаем input в контейнер
        container.appendChild(input);
        
        // Создаем кнопку выбора
        const pickerBtn = document.createElement('button');
        pickerBtn.className = 'route-picker-btn';
        pickerBtn.innerHTML = '📍';
        pickerBtn.title = title;
        pickerBtn.type = 'button';
        
        container.appendChild(pickerBtn);
        
        // Обработчик клика на кнопку
        pickerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startPickingPoint(type, pickerBtn);
        });
        
        return pickerBtn;
    }

    startPickingPoint(type, button) {
        console.log(`🎯 Начинаем выбор точки для: ${type}`);
        
        // Сбрасываем предыдущий режим выбора
        this.resetPickingMode();
        
        // Устанавливаем новый режим
        this.activeInput = type;
        this.isPickingPoint = true;
        
        // Подсвечиваем кнопку
        button.classList.add('active');
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        
        // Изменяем курсор карты
        this.map.getContainer().style.cursor = 'crosshair';
        
        // Показываем подсказку
        this.showPickingTooltip(type);
    }

    resetPickingMode() {
        this.isPickingPoint = false;
        this.activeInput = null;
        
        // Сбрасываем стили всех кнопок
        document.querySelectorAll('.route-picker-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.backgroundColor = '';
            btn.style.color = '';
        });
        
        // Восстанавливаем курсор
        this.map.getContainer().style.cursor = '';
        
        // Убираем подсказку
        this.hidePickingTooltip();
    }

    showPickingTooltip(type) {
        const typeText = type === 'from' ? 'начальную' : 'конечную';
        const popup = L.popup()
            .setLatLng(this.map.getCenter())
            .setContent(`
                <div style="text-align: center; padding: 10px;">
                    <h4>🎯 Выберите ${typeText} точку</h4>
                    <p>Кликните на карте, чтобы установить точку маршрута</p>
                    <button onclick="window.routeController.resetPickingMode()" 
                            style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        ❌ Отмена
                    </button>
                </div>
            `)
            .openOn(this.map);
            
        this.pickingTooltip = popup;
    }

    hidePickingTooltip() {
        if (this.pickingTooltip) {
            this.map.closePopup(this.pickingTooltip);
            this.pickingTooltip = null;
        }
    }

    initMapClickHandler() {
        this.map.on('click', (e) => {
            if (this.isPickingPoint && this.activeInput) {
                console.log(`📍 Точка выбрана для ${this.activeInput}:`, e.latlng);
                this.setPointFromMap(e.latlng);
                this.resetPickingMode();
            }
        });
    }

    async setPointFromMap(latlng) {
        console.log('🔍 Получаем адрес для координат:', latlng);
        
        try {
            // Пытаемся получить адрес
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name || `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            
            this.setPoint(this.activeInput, latlng, address);
            console.log('✅ Адрес получен:', address);
            
        } catch (error) {
            console.warn('⚠️ Не удалось получить адрес, используем координаты:', error);
            const coordsStr = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
            this.setPoint(this.activeInput, latlng, coordsStr);
        }
    }

    setPoint(type, coords, displayName = '') {
        console.log(`📌 Устанавливаем точку ${type}:`, coords, displayName);
        
        if (type === 'from') {
            this.fromCoords = coords;
            this.routeFrom.value = displayName || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            this.addMarker(coords, 'start', '🚀 Начальная точка');
        } else if (type === 'to') {
            this.toCoords = coords;
            this.routeTo.value = displayName || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            this.addMarker(coords, 'end', '🏁 Конечная точка');
        }
        
        // Автоматически строим маршрут если есть обе точки
        if (this.fromCoords && this.toCoords) {
            this.calculateRoute();
        }
    }

    // Публичные методы для использования из геолокации
    setStartPoint(lat, lng) {
        const coords = L.latLng(lat, lng);
        this.setPoint('from', coords, `Моё местоположение (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    }

    setEndPoint(lat, lng) {
        const coords = L.latLng(lat, lng);
        this.setPoint('to', coords, `Выбранная точка (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    }

    addMarker(coords, type, popupText) {
        // Удаляем предыдущий маркер этого типа
        this.markersLayer.eachLayer(layer => {
            if (layer.markerType === type) {
                this.markersLayer.removeLayer(layer);
            }
        });

        let iconColor = type === 'start' ? 'green' : 'red';
        let iconUrl = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${iconColor}.png`;

        const marker = L.marker(coords, {
            icon: L.icon({
                iconUrl: iconUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            })
        });
        
        marker.markerType = type;
        marker.bindPopup(popupText);
        this.markersLayer.addLayer(marker);
        
        console.log(`✅ Маркер ${type} добавлен`);
    }

    initEvents() {
        this.calculateBtn.addEventListener('click', () => {
            console.log('🔄 Кнопка расчета маршрута нажата');
            this.calculateRoute();
        });
        
        // Обработка ввода координат вручную
        this.routeFrom.addEventListener('change', () => this.parseInputCoords('from'));
        this.routeTo.addEventListener('change', () => this.parseInputCoords('to'));
        
        // Кнопка добавления промежуточной точки
        this.addViaBtn.addEventListener('click', () => this.addViaPoint());
        
        console.log('✅ События инициализированы');
    }

    parseInputCoords(type) {
        const input = type === 'from' ? this.routeFrom : this.routeTo;
        const value = input.value.trim();
        
        // Пытаемся распарсить координаты
        const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
        const match = value.match(coordPattern);
        
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                const coords = L.latLng(lat, lng);
                console.log(`📝 Координаты введены вручную для ${type}:`, coords);
                
                if (type === 'from') {
                    this.fromCoords = coords;
                    this.addMarker(coords, 'start', '🚀 Начальная точка');
                } else {
                    this.toCoords = coords;
                    this.addMarker(coords, 'end', '🏁 Конечная точка');
                }
                
                // Автоматически строим маршрут если есть обе точки
                if (this.fromCoords && this.toCoords) {
                    this.calculateRoute();
                }
            }
        }
    }

    async calculateRoute() {
        if (!this.fromCoords || !this.toCoords) {
            this.routeInfo.innerHTML = `
                <div style="padding: 15px; text-align: center; color: #f44336;">
                    <h4>⚠️ Недостаточно данных</h4>
                    <p>Укажите начальную и конечную точки маршрута</p>
                </div>
            `;
            return;
        }

        console.log('🚗 Начинаем расчет маршрута от', this.fromCoords, 'до', this.toCoords);
        
        // Показываем индикатор загрузки
        this.routeInfo.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">🔄</div>
                <h4>Построение маршрута...</h4>
                <p>Пожалуйста, подождите</p>
            </div>
        `;

        try {
            // Используем OpenRouteService API (бесплатный)
            const response = await fetch(
                `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248d7bb46f0fc264cb7bfd0f8b3e5cf47e8&start=${this.fromCoords.lng},${this.fromCoords.lat}&end=${this.toCoords.lng},${this.toCoords.lat}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Маршрут получен:', data);
            
            this.displayRoute(data);
            
        } catch (error) {
            console.error('❌ Ошибка при построении маршрута:', error);
            
            // Показываем ошибку и предлагаем альтернативу
            this.routeInfo.innerHTML = `
                <div style="padding: 15px; text-align: center; color: #f44336;">
                    <h4>❌ Ошибка построения маршрута</h4>
                    <p>Не удалось подключиться к сервису маршрутизации</p>
                    <div style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                        <h5>Альтернативы:</h5>
                        <button onclick="window.open('https://www.google.com/maps/dir/${this.fromCoords.lat},${this.fromCoords.lng}/${this.toCoords.lat},${this.toCoords.lng}', '_blank')" 
                                style="padding: 5px 10px; margin: 2px; background: #4285f4; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            🗺️ Google Maps
                        </button>
                        <button onclick="window.open('https://yandex.ru/maps/?rtext=${this.fromCoords.lat},${this.fromCoords.lng}~${this.toCoords.lat},${this.toCoords.lng}&rtt=auto', '_blank')" 
                                style="padding: 5px 10px; margin: 2px; background: #fc3; color: black; border: none; border-radius: 3px; cursor: pointer;">
                            🟡 Яндекс.Карты
                        </button>
                    </div>
                </div>
            `;
            
            // Рисуем прямую линию как запасной вариант
            this.drawStraightLine();
        }
    }

    displayRoute(data) {
        if (!data.features || data.features.length === 0) {
            throw new Error('Маршрут не найден');
        }

        const route = data.features[0];
        const coordinates = route.geometry.coordinates;
        const properties = route.properties;
        
        // Очищаем предыдущий маршрут
        this.routeLayer.clearLayers();
        
        // Рисуем маршрут на карте
        const routeLine = L.polyline(
            coordinates.map(coord => [coord[1], coord[0]]), // Переворачиваем lng,lat в lat,lng
            {
                color: '#2196F3',
                weight: 5,
                opacity: 0.8
            }
        );
        
        this.routeLayer.addLayer(routeLine);
        
        // Центрируем карту на маршрут
        this.map.fitBounds(routeLine.getBounds(), {
            padding: [20, 20]
        });
        
        // Показываем информацию о маршруте
        const distance = (properties.summary.distance / 1000).toFixed(1);
        const duration = Math.round(properties.summary.duration / 60);
        
        this.routeInfo.innerHTML = `
            <div style="padding: 15px;">
                <h4 style="color: #2196F3; margin: 0 0 15px 0;">🗺️ Маршрут построен!</h4>
                <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 5px 0;"><strong>📏 Расстояние:</strong> ${distance} км</p>
                    <p style="margin: 5px 0;"><strong>⏱️ Время в пути:</strong> ${duration} мин</p>
                </div>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button onclick="window.routeController.clearRoute()" 
                            style="padding: 8px 12px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        🗑️ Очистить
                    </button>
                    <button onclick="window.open('https://www.google.com/maps/dir/${this.fromCoords.lat},${this.fromCoords.lng}/${this.toCoords.lat},${this.toCoords.lng}', '_blank')" 
                            style="padding: 8px 12px; background: #4285f4; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        📱 Google Maps
                    </button>
                </div>
            </div>
        `;
        
        console.log('✅ Маршрут отображен на карте');
    }

    drawStraightLine() {
        // Рисуем прямую линию как запасной вариант
        this.routeLayer.clearLayers();
        
        const line = L.polyline([this.fromCoords, this.toCoords], {
            color: '#FF9800',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
        });
        
        this.routeLayer.addLayer(line);
        
        // Центрируем карту
        this.map.fitBounds(line.getBounds(), {
            padding: [20, 20]
        });
        
        // Считаем примерное расстояние
        const distance = (this.fromCoords.distanceTo(this.toCoords) / 1000).toFixed(1);
        
        this.routeInfo.innerHTML = `
            <div style="padding: 15px;">
                <h4 style="color: #FF9800; margin: 0 0 15px 0;">📏 Прямое расстояние</h4>
                <div style="background: #fff3e0; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 5px 0;"><strong>Расстояние по прямой:</strong> ${distance} км</p>
                    <p style="margin: 5px 0; font-size: 12px; color: #666;">⚠️ Показано приблизительное направление</p>
                </div>
            </div>
        `;
    }

    clearRoute() {
        console.log('🗑️ Очистка маршрута');
        
        // Очищаем все слои
        this.routeLayer.clearLayers();
        this.markersLayer.clearLayers();
        
        // Очищаем поля
        this.routeFrom.value = '';
        this.routeTo.value = '';
        this.routeInfo.innerHTML = '';
        
        // Сбрасываем координаты
        this.fromCoords = null;
        this.toCoords = null;
        this.viaCoords = [];
        
        // Сбрасываем режим выбора
        this.resetPickingMode();
        
        console.log('✅ Маршрут очищен');
    }

    addViaPoint() {
        console.log('➕ Добавление промежуточной точки');
        // Пока оставляем простую заглушку
        alert('🚧 Промежуточные точки будут добавлены в следующей версии');
    }
}
