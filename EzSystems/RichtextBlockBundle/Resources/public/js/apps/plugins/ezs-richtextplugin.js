/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ezs-richtextplugin', function (Y) {
    "use strict";
    /**
     * @module ezs-richtextplugin
     */
    Y.namespace('eZ.Plugin');

    /**
     * Plugin that add support to richtext field type in eZStudio blocks
     *
     * @namespace eZ.Plugin
     * @class RichText
     * @constructor
     * @extends Plugin.Base
     */
    Y.eZ.Plugin.RichText = Y.Base.create('studioRichTextPlugin', Y.Plugin.Base, [], {
        initializer: function () {
            var formView = this.get('host'),
                formFieldViewsMap = formView.get('formFieldViewsMap');

            formFieldViewsMap['richtext'] = Y.eZS.RichTextFieldView;
            formView.set('formFieldViewsMap', formFieldViewsMap);

            formView.after('showPopupOverlay', this._afterPopupOverlayShow, this);
            formView.after('hidePopupOverlay', this._afterPopupOverlayHide, this);
        },

        _afterPopupOverlayShow: function(){
            this._onPopupDisplayedChange(true);
        },
        _afterPopupOverlayHide: function(){
            this._onPopupDisplayedChange(false);
        },
        _onPopupDisplayedChange: function(displayed){
            var formView = this.get('host');
            formView.get('formFieldViews').forEach(Y.bind(function (field) {
                field.fire('popupDisplayedChange', displayed);
            }, this));
        },
    }, {
        NS: 'richText',
    });

    Y.eZ.PluginRegistry.registerPlugin(
        Y.eZ.Plugin.RichText, ['studioBlockPopupFormView']
    );
});
