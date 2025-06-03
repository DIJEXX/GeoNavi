// Реализация боковой панели в стиле Яндекс Карт
ymaps.modules.define('Panel', [
    'util.augment',
    'collection.Item'
], function (provide, augment, item) {
    var Panel = function (options) {
        Panel.superclass.constructor.call(this, options);
    };

    augment(Panel, item, {
        onAddToMap: function (map) {
            Panel.superclass.onAddToMap.call(this, map);
            this.getParent().getChildElement(this).then(this._onGetChildElement, this);
            map.margin.addArea({
                top: 0,
                left: 0,
                width: '250px',
                height: '100%'
            });
        },

        onRemoveFromMap: function (oldMap) {
            if (this._$control) {
                this._$control.remove();
            }
            Panel.superclass.onRemoveFromMap.call(this, oldMap);
        },

        _onGetChildElement: function (parentDomContainer) {
            this._$control = $('<div class="customControl"><div class="content"></div><div class="closeButton"></div></div>').appendTo(parentDomContainer);
            this._$content = $('.content');
            $('.closeButton').on('click', this._onClose);
        },
        
        _onClose: function () {
            $('.customControl').removeClass('open');
            $('#expandBtn').text('≡');
            if (window.myMap) {
                window.myMap.invalidateSize();
            }
        },
        
        setContent: function (text) {
            this._$control.addClass('open');
            this._$content.html(text);
            if (window.myMap) {
                window.myMap.invalidateSize();
            }
        }
    });

    provide(Panel);
});