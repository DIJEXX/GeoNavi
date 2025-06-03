ymaps.ready(['Panel']).then(function () {
    // Создаем панель и добавляем на карту
    var panel = new ymaps.Panel();
    myMap.controls.add(panel, {
        float: 'left'
    });
    
    // Пример контента для панели
    var defaultContent = `
        <h3>Меню</h3>
        <div class="menu-item" onclick="showMenuItem('places')">Мои места</div>
        <div class="menu-item" onclick="showMenuItem('history')">История</div>
        <div class="menu-item" onclick="showMenuItem('settings')">Настройки</div>
    `;
    
    // Устанавливаем контент по умолчанию
    panel.setContent(defaultContent);
    
    // Функция для отображения контента в панели
    window.showMenuItem = function(item) {
        var content = '';
        switch(item) {
            case 'places':
                content = '<h3>Мои места</h3><p>Список сохранённых мест...</p>';
                break;
            case 'history':
                content = '<h3>История</h3><p>История поиска...</p>';
                break;
            case 'settings':
                content = '<h3>Настройки</h3><p>Настройки карты...</p>';
                break;
            default:
                content = defaultContent;
        }
        panel.setContent(content);
    };
});
    // Обработчик для результатов поиска
    searchControl.events.add('resultselect', function(e) {
        const selected = e.get('index');
        const geoObject = searchControl.getResults().get(selected);
        
        if (geoObject) {
            const content = `
                <h3>${geoObject.properties.get('name')}</h3>
                <p>${geoObject.properties.get('description') || geoObject.getAddress()}</p>
                <p>Координаты: ${geoObject.geometry.getCoordinates().join(', ')}</p>
                <button onclick="copyToClipboard('${geoObject.geometry.getCoordinates().join(', ')}')">
                    Копировать координаты
                </button>
            `;
            
            panel.setContent(content);
            myMap.panTo(geoObject.geometry.getCoordinates());
        }
    });