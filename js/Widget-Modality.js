var WIDGET         = 'widget',
    HOST            = 'host',
    RENDER_UI       = 'renderUI',
    BIND_UI         = 'bindUI',
    SYNC_UI         = 'syncUI',
    RENDERED        = 'rendered',
    BOUNDING_BOX    = 'boundingBox',
    CONTENT_BOX     = 'contentBox',
    VISIBLE         = 'visible',
    Z_INDEX         = 'zIndex',
    ALIGN           = 'align',

    CHANGE          = 'Change',

    isBoolean       = Y.Lang.isBoolean,
    getCN           = Y.ClassNameManager.getClassName,

    supportsPosFixed = (function(){

        /*! IS_POSITION_FIXED_SUPPORTED - Juriy Zaytsev (kangax) - http://yura.thinkweb2.com/cft/ */

        var isSupported = null,
            el, root;

        if (document.createElement) {
            el = document.createElement('div');
            if (el && el.style) {
                el.style.position = 'fixed';
                el.style.top = '10px';
                root = document.body;
                if (root && root.appendChild && root.removeChild) {
                    root.appendChild(el);
                    isSupported = (el.offsetTop === 10);
                    root.removeChild(el);
                }
            }
        }

        return isSupported;
    }()),

    WidgetModal;

(function(){

    var WIDGET_MODAL   = 'widgetModal',
        MODAL           = 'modal',
        MASK            = 'mask',
        MODAL_CLASSES   = {
            modal   : getCN(WIDGET, MODAL),
            mask    : getCN(WIDGET, MASK)
        };

    WidgetModal = Y.Base.create(WIDGET_MODAL, Y.Plugin.Base, [], {

        // *** Instance Members *** //

        _maskNode   : null,
        _uiHandles  : null,

        // *** Lifecycle Methods *** //

        initializer : function (config) {

            this.afterHostMethod(RENDER_UI, this.renderUI);
            this.afterHostMethod(BIND_UI, this.bindUI);
            this.afterHostMethod(SYNC_UI, this.syncUI);

            if (this.get(HOST).get(RENDERED)) {
                this.renderUI();
                this.bindUI();
                this.syncUI();
            }

            var m = Y.one('#yui3-widget-mask');
            if (m) {
                this._maskNode = m;
            }

        },

        destructor : function () {

            if (this._maskNode) {
                this._maskNode.remove(true);
            }

            this._detachUIHandles();
            this.get(HOST).get(BOUNDING_BOX).removeClass(MODAL_CLASSES.modal);
        },

        renderUI : function () {
            //console.log(this.get('maskNode'));
            
            var bb = this.get(HOST).get(BOUNDING_BOX),
                cb = this.get(HOST).get(CONTENT_BOX),
                bbParent = bb.get('parentNode') || Y.one('body'),
                m;
            
            if (this.get('maskNode') === null) {
                console.log("Im here");
                m = this._createMask();
            }
            else {
                console.log("no im here");
                m = this.get('maskNode');
                this._maskNode.remove();
            }

            //this makes the content box content appear over the mask
            cb.setStyles({
                position: "relative"
            });

            bbParent.insert(m, bbParent.get('firstChild'));
            bb.addClass(MODAL_CLASSES.modal);

        },

        bindUI : function () {

            this.afterHostEvent(VISIBLE+CHANGE, this._afterHostVisibleChange);
            this.afterHostEvent(Z_INDEX+CHANGE, this._afterHostZIndexChange);
        },

        syncUI : function () {

            var host = this.get(HOST);

            this._uiSetHostVisible(host.get(VISIBLE));
            this._uiSetHostZIndex(host.get(Z_INDEX));
        },

        // *** Private Methods *** //

        _createMask: function() {
            this._maskNode = Y.Node.create('<div></div>');
            this._maskNode.set('id', MODAL_CLASSES.mask);
            //this._maskNode.addClass(MODAL_CLASSES.mask);
            this._maskNode.setStyles({
                position    : supportsPosFixed ? 'fixed' : 'absolute',
                width       : '100%',
                height      : '100%',
                top         : '0',
                left        : '0',
                display     : 'block'
            });

            return this._maskNode;
        },

        _focus : function (e) {

            
            var host = this.get(HOST),
                bb = host.get(BOUNDING_BOX),
                oldTI = bb.get('tabIndex');

            bb.set('tabIndex', oldTI >= 0 ? oldTI : 0);
            //Y.later(0, host, 'focus');
            host.focus();
            //bb.set('tabIndex', oldTI);
        },

        _blur : function () {

            this.get(HOST).blur();
        },

        _getMaskNode : function () {

            return this._maskNode;
        },

        _uiSetHostVisible : function (visible) {

            if (visible) {
                Y.later(1, this, '_attachUIHandles');
                this._maskNode.setStyle('display', 'block');
                this._focus();
            } else {
                this._detachUIHandles();
                this._maskNode.setStyle('display', 'none');
                this._blur();
            }
        },

        _uiSetHostZIndex : function (zIndex) {

            this._maskNode.setStyle(Z_INDEX, zIndex || 0);
        },

        _attachUIHandles : function (modal) {

            if (this._uiHandles) { return; }

            var host = this.get(HOST),
                bb = host.get(BOUNDING_BOX);

            this._uiHandles = [
                bb.on('clickoutside', Y.bind(this._focus, this)),
                bb.on('focusoutside', Y.bind(this._focus, this)),
                //bb.on('selectoutside', Y.bind(this._focus, this))
            ];

            if ( ! supportsPosFixed) {
                this._uiHandles.push(Y.one('win').on('scroll', Y.bind(function(e){
                    var maskNode = this._maskNode;
                    maskNode.setStyle('top', maskNode.get('docScrollY'));
                }, this)));
            }
        },

        _detachUIHandles : function () {

            Y.each(this._uiHandles, function(h){
                h.detach();
            });
            this._uiHandles = null;
        },

        _afterHostVisibleChange : function (e) {

            this._uiSetHostVisible(e.newVal);
        },

        _afterHostZIndexChange : function (e) {

            this._uiSetHostZIndex(e.newVal);
        }

    }, {

        // *** Static *** //

        NS      : MODAL,

        ATTRS   : {

            maskNode : {
                getter      : '_getMaskNode',
                readOnly    : true,
                lazyAdd     : false
            },

            node: {
                value: undefined
            }

        },

        CLASSES : MODAL_CLASSES

    });
    Y.namespace("Plugin").Modal = WidgetModal;

}());