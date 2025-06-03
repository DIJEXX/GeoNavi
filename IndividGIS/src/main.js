// Инициализация карты с базовыми слоями
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    attribution: 'Google Гибрид',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
});

var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: 'Google Спутник',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
});

var yandexSat = L.yandex('satellite', {
    attribution: 'Яндекс Спутник'
});

var yandexMap = L.yandex('map', {
    attribution: 'Яндекс карты',
});

function traffic() {
    var trafficProvider = new ymaps.traffic.provider.Actual({}, {
        infoLayerShown: true
    });
    trafficProvider.setMap(this._yandex);
};

L.Yandex.addInitHook('on','load', function(){
    this._setStyle(this._yandex.controls.getContainer(), {
        right: '60px',
        top: '11px',
        width: 'auto'
    });
});

function trafficControl(){
    this._yandex.controls
        .add('trafficControl', {size: 'auto'})
        .get('trafficControl').state.set('trafficShow', true)
};

// Создаем слои Яндекс Пробок
var yandexTraffic = L.yandex('overlay', {
    attribution: 'Данные дорожной обстановки Yandex',
}).on('load', traffic);

var yandexTrafficControl = L.yandex('overlay', {
    attribution: 'Данные дорожной обстановки Yandex',
}).on('load', trafficControl);


var baseLayers = {
    "OpenStreetMap": osmLayer,
    "Google Гибрид": googleHybrid,
    "Google Спутник": googleSat,
    "Yandex Карта": yandexMap,
    "Yandex Спутник": yandexSat
};
var overlayLayers = {
    'Яндекс пробки': yandexTrafficControl,
};



var myMap = L.map('map', {
    center: [55.751244, 37.618423],
    zoom: 12,
    layers: [osmLayer],
    zoomControl: false
});

// Добавляем контролы в правый нижний угол
L.control.zoom({
    position: 'bottomright'
}).addTo(myMap);

// Добавляем переключатель слоев
L.control.layers(baseLayers, overlayLayers, {
    position: 'topright'
}).addTo(myMap);

// Координатная кнопка
var coordControl = L.control({position: 'bottomright'});

coordControl.onAdd = function(map) {
    var container = L.DomUtil.create('div', 'coord-button-container');
    var btn = L.DomUtil.create('button', 'coord-button', container);
    btn.innerHTML = '⌖';
    var coordModeActive = false;
    var clickHandler = null;
    
    L.DomEvent.on(btn, 'click', function() {
        coordModeActive = !coordModeActive;
        
        if (coordModeActive) {
            btn.style.backgroundColor = '#4CAF50';
            btn.style.color = 'white';
            
            clickHandler = function(e) {
                var coords = e.latlng;
                var lat = coords.lat.toFixed(6);
                var lng = coords.lng.toFixed(6);
                
                // Создаем улучшенный popup как в геолокации
                const popupContent = `
                    <div style="text-align: center; padding: 5px;">
                        <h3 style="margin: 0 0 10px 0; color: #2196F3;">🎯 Выбранная точка</h3>
                        <p style="margin: 5px 0;"><strong>Координаты:</strong><br>${lat}, ${lng}</p>
                        <div style="display: flex; gap: 5px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
                            <button onclick="copyCoordinates('${lat}, ${lng}')" 
                                    style="padding: 5px 8px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                📋 Копировать
                            </button>
                            <button onclick="setAsStartPoint(${lat}, ${lng})" 
                                    style="padding: 5px 8px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                🚀 Начальная точка
                            </button>
                            <button onclick="setAsEndPoint(${lat}, ${lng})" 
                                    style="padding: 5px 8px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                🏁 Конечная точка
                            </button>
                        </div>
                    </div>
                `;
                
                L.popup()
                    .setLatLng(coords)
                    .setContent(popupContent)
                    .openOn(map);
            };
            
            map.on('click', clickHandler);
        } else {
            btn.style.backgroundColor = '#fff';
            btn.style.color = 'black';
            if (clickHandler) {
                map.off('click', clickHandler);
            }
            map.closePopup();
        }
    });
    
    return container;
};

coordControl.addTo(myMap);


// Удалено: кнопка определения местоположения по IP (не работает)

// Удалено: функции определения местоположения по IP (не работают)




// Управление боковой панелью
document.addEventListener('DOMContentLoaded', function() {
    const expandBtn = document.getElementById('expandBtn');
    const sidePanel = document.getElementById('sidePanel');
    const closePanel = document.getElementById('closePanel');
    
    // Открытие/закрытие панели
    expandBtn.addEventListener('click', function() {
        sidePanel.classList.toggle('open');
        this.textContent = sidePanel.classList.contains('open') ? '×' : '≡';
        myMap.invalidateSize();
    });
    
    closePanel.addEventListener('click', function() {
        sidePanel.classList.remove('open');
        expandBtn.textContent = '≡';
        myMap.invalidateSize();
    });
    
    // Переключение вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убираем активные классы
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Добавляем активные классы
            this.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
            // Обновляем размер карты
            setTimeout(() => myMap.invalidateSize(), 100);
        });
    });
    
    // Инициализация модулей
    window.searchController = new SearchController(myMap);
    window.routeController = new RouteController(myMap);
    window.themesController = new ThemesController(myMap);
    initThemeTab();
    addGeolocationButton();
    // Опционально: запрашивать местоположение при первом открытии
    if (localStorage.getItem('locationRequested') !== 'true') {
        setTimeout(() => {
            if (confirm("Хотите разрешить доступ к вашему местоположению для более точной работы карты?")) {
                locateUser();
            }
            localStorage.setItem('locationRequested', 'true');
        }, 3000);
    }
});

function initThemeTab() {
    // Добавляем небольшую задержку для гарантии инициализации
    setTimeout(() => {
        const themeButtons = document.getElementById('themeButtons');
        const themeRadius = document.getElementById('themeRadius');
        const addThemeBtn = document.getElementById('addThemeBtn');
        const addThemeForm = document.getElementById('addThemeForm');
        const submitTheme = document.getElementById('submitTheme');
        
        if (!themeButtons || !window.themesController) {
            console.warn('⚠️ Элементы тем не найдены, повторная попытка...');
            setTimeout(initThemeTab, 500);
            return;
        }
        
        // Очищаем предыдущие кнопки
        themeButtons.innerHTML = '';
        
        // Добавляем базовые темы
        if (window.themesController && window.themesController.baseThemes) {
            window.themesController.baseThemes.forEach(theme => {
                const btn = document.createElement('button');
                btn.className = 'theme-btn';
                btn.textContent = theme.name;
                btn.addEventListener('click', () => {
                    const radius = parseInt(themeRadius.value) || 5;
                    window.themesController.loadTheme(theme, radius);
                });
                themeButtons.appendChild(btn);
            });
            console.log('✅ Темы инициализированы:', window.themesController.baseThemes.length);
        }
        
        // Обработчик кнопки добавления темы
        if (addThemeBtn && addThemeForm) {
            addThemeBtn.addEventListener('click', () => {
                addThemeForm.style.display = addThemeForm.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        // Обработчик подтверждения новой темы
        if (submitTheme) {
            submitTheme.addEventListener('click', () => {
                const name = document.getElementById('themeName').value;
                const geojsonText = document.getElementById('themeGeoJSON').value;
                
                try {
                    const geojson = JSON.parse(geojsonText);
                    const newTheme = window.themesController.addCustomTheme(name, geojson);
                    
                    // Добавляем кнопку для новой темы
                    const btn = document.createElement('button');
                    btn.className = 'theme-btn';
                    btn.textContent = newTheme.name;
                    btn.addEventListener('click', () => {
                        window.themesController.loadCustomTheme(newTheme);
                    });
                    themeButtons.appendChild(btn);
                    
                    // Очищаем форму
                    document.getElementById('themeName').value = '';
                    document.getElementById('themeGeoJSON').value = '';
                    addThemeForm.style.display = 'none';
                } catch (e) {
                    alert('Ошибка в формате GeoJSON: ' + e.message);
                }
            });
        }
    }, 100);
}

// Добавляем кнопку геолокации устройства
function addGeolocationButton() {
    const geolocationControl = L.control({position: 'bottomright'});

    geolocationControl.onAdd = function(map) {
        const container = L.DomUtil.create('div', 'geolocation-button-container');
        const btn = L.DomUtil.create('button', 'geolocation-button', container);
        btn.innerHTML = '📍';
        btn.title = 'Определить моё точное местоположение';
        
        L.DomEvent.on(btn, 'click', function() {
            // Визуальная обратная связь при нажатии
            btn.style.backgroundColor = '#3388ff';
            btn.style.color = 'white';
            locateUser();
            // Возвращаем первоначальный вид кнопки через 2 секунды
            setTimeout(() => {
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 2000);
        });
        
        return container;
    };

    geolocationControl.addTo(myMap);
}

// Функция определения местоположения устройства
function locateUser() {
    console.log('🔍 Запущена функция определения местоположения');
    
    if (!navigator.geolocation) {
        console.error('❌ Геолокация не поддерживается браузером');
        alert('Геолокация не поддерживается вашим браузером');
        return;
    }

    console.log('✅ Геолокация поддерживается, запускаем...');
    
    // Показываем индикатор загрузки
    if (myMap && myMap.spin) {
        myMap.spin(true);
        console.log('🔄 Включен индикатор загрузки');
    }
    
    // Альтернативный индикатор если spin не работает
    const loadingPopup = L.popup()
        .setLatLng(myMap.getCenter())
        .setContent(`
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 20px;">🔄</div>
                <p>Определяем местоположение...</p>
            </div>
        `)
        .openOn(myMap);
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            console.log('✅ Местоположение получено:', position);
            
            // Убираем индикаторы загрузки
            if (myMap && myMap.spin) {
                myMap.spin(false);
            }
            myMap.closePopup(loadingPopup);
            
            const userLocation = [position.coords.latitude, position.coords.longitude];
            const accuracy = Math.round(position.coords.accuracy);
            
            console.log('📍 Координаты:', userLocation, 'Точность:', accuracy);
            
            // Удаляем предыдущие маркеры
            if (window.userLocationMarker) {
                myMap.removeLayer(window.userLocationMarker);
                console.log('🗑️ Удален предыдущий маркер');
            }
            if (window.accuracyCircle) {
                myMap.removeLayer(window.accuracyCircle);
                console.log('🗑️ Удален предыдущий круг точности');
            }
            
            // Создаем простой маркер (сначала стандартный)
            try {
                window.userLocationMarker = L.marker(userLocation).addTo(myMap);
                console.log('✅ Добавлен стандартный маркер');
                
                // Попробуем изменить иконку
                try {
                    window.userLocationMarker.setIcon(L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    }));
                    console.log('✅ Установлена красная иконка');
                } catch (iconError) {
                    console.warn('⚠️ Не удалось загрузить красную иконку, используем стандартную:', iconError);
                }
                
                // Добавляем круг точности если нужно
                if (accuracy > 100) {
                    try {
                        window.accuracyCircle = L.circle(userLocation, {
                            radius: accuracy,
                            color: '#3388ff',
                            fillColor: '#3388ff',
                            fillOpacity: 0.1,
                            weight: 2
                        }).addTo(myMap);
                        console.log('✅ Добавлен круг точности');
                    } catch (circleError) {
                        console.warn('⚠️ Не удалось добавить круг точности:', circleError);
                    }
                }
                
                // Создаем popup
                const popupContent = `
                    <div style="text-align: center; padding: 5px;">
                        <h3 style="margin: 0 0 10px 0; color: #2196F3;">📍 Ваше местоположение</h3>
                        <p style="margin: 5px 0;"><strong>Координаты:</strong><br>${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}</p>
                        <p style="margin: 5px 0;"><strong>Точность:</strong> ±${accuracy} метров</p>
                        <div style="display: flex; gap: 5px; margin-top: 8px; flex-wrap: wrap; justify-content: center;">
                            <button onclick="copyCoordinates('${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}')" 
                                    style="padding: 5px 8px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                📋 Копировать
                            </button>
                            <button onclick="setAsStartPoint(${userLocation[0]}, ${userLocation[1]})" 
                                    style="padding: 5px 8px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                🚀 Начальная точка
                            </button>
                            <button onclick="setAsEndPoint(${userLocation[0]}, ${userLocation[1]})" 
                                    style="padding: 5px 8px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                                🏁 Конечная точка
                            </button>
                        </div>
                    </div>
                `;
                
                window.userLocationMarker.bindPopup(popupContent).openPopup();
                console.log('✅ Popup привязан и открыт');
                
                // Центрируем карту
                const zoomLevel = accuracy > 1000 ? 12 : accuracy > 500 ? 14 : 16;
                myMap.flyTo(userLocation, zoomLevel);
                console.log('✅ Карта центрирована на', userLocation, 'с зумом', zoomLevel);
                
                // Показываем уведомление об успехе
                setTimeout(() => {
                    alert(`✅ Местоположение найдено!\nКоординаты: ${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}\nТочность: ±${accuracy} метров`);
                }, 500);
                
            } catch (markerError) {
                console.error('❌ Ошибка при создании маркера:', markerError);
                alert(`Координаты получены: ${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}\nНо не удалось создать маркер на карте.`);
            }
        },
        function(error) {
            console.error('❌ Ошибка геолокации:', error);
            
            // Убираем индикаторы загрузки
            if (myMap && myMap.spin) {
                myMap.spin(false);
            }
            myMap.closePopup(loadingPopup);
            
            let errorMessage = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Доступ к геолокации запрещен.\nПроверьте настройки браузера и разрешите доступ к местоположению.";
                    console.error('🚫 Доступ запрещен пользователем');
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Местоположение недоступно.\nПроверьте подключение к интернету и включите GPS.";
                    console.error('📡 Местоположение недоступно');
                    break;
                case error.TIMEOUT:
                    errorMessage = "Время ожидания истекло.\nПопробуйте еще раз.";
                    console.error('⏰ Тайм-аут');
                    break;
                default:
                    errorMessage = `Неизвестная ошибка: ${error.message}`;
                    console.error('❓ Неизвестная ошибка:', error);
                    break;
            }
            
            alert(`❌ Ошибка определения местоположения:\n${errorMessage}`);
            
            // Также показываем popup с ошибкой
            L.popup()
                .setLatLng(myMap.getCenter())
                .setContent(`
                    <div style="padding: 15px; text-align: center; max-width: 300px;">
                        <h3 style="color: #f44336; margin: 0 0 10px 0;">❌ Ошибка</h3>
                        <p>${errorMessage}</p>
                        <button onclick="locateUser()" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            🔄 Попробовать снова
                        </button>
                    </div>
                `)
                .openOn(myMap);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 30000  // Уменьшил кеш до 30 сек для отладки
        }
    );
}

// Вспомогательная функция для копирования координат
function copyCoordinates(coords) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(coords).then(function() {
            alert('📋 Координаты скопированы: ' + coords);
        }).catch(function() {
            alert('📋 Координаты: ' + coords + '\n(Скопируйте вручную)');
        });
    } else {
        alert('📋 Координаты: ' + coords + '\n(Скопируйте вручную)');
    }
}

// Функция установки начальной точки маршрута
function setAsStartPoint(lat, lng) {
    if (window.routeController) {
        const coords = L.latLng(lat, lng);
        const displayName = `Моё местоположение (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        window.routeController.setPoint('from', coords, displayName);
        alert('🚀 Начальная точка маршрута установлена!');
        // Закрываем popup
        myMap.closePopup();
        // Открываем панель маршрутов
        openRoutingTab();
    } else {
        alert('❌ Система маршрутизации не загружена');
    }
}

// Функция установки конечной точки маршрута
function setAsEndPoint(lat, lng) {
    if (window.routeController) {
        const coords = L.latLng(lat, lng);
        const displayName = `Выбранная точка (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
        window.routeController.setPoint('to', coords, displayName);
        alert('🏁 Конечная точка маршрута установлена!');
        // Закрываем popup
        myMap.closePopup();
        // Открываем панель маршрутов
        openRoutingTab();
    } else {
        alert('❌ Система маршрутизации не загружена');
    }
}

// Функция открытия вкладки маршрутов
function openRoutingTab() {
    // Открываем боковую панель
    const sidePanel = document.getElementById('sidePanel');
    const expandBtn = document.getElementById('expandBtn');
    if (!sidePanel.classList.contains('open')) {
        sidePanel.classList.add('open');
        expandBtn.textContent = '×';
    }
    
    // Переключаемся на вкладку маршрутов
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const routingTabBtn = document.querySelector('[data-tab="routing"]');
    const routingTab = document.getElementById('routingTab');
    
    if (routingTabBtn && routingTab) {
        routingTabBtn.classList.add('active');
        routingTab.classList.add('active');
    }
    
    setTimeout(() => myMap.invalidateSize(), 100);
}