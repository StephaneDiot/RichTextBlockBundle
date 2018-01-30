YUI.add('ezs-landingpageviewservicesplugin', function (Y) {
    "use strict";
    /**
     * @module ezs-landingpageviewservicesplugin
     */
    Y.namespace('eZ.Plugin');

    /**
     *
     * @namespace eZ.Plugin
     * @class LandingPageViewServices
     * @constructor
     * @extends Plugin.Base
     */
    Y.eZ.Plugin.LandingPageViewServices = Y.Base.create('landingPageViewServicesPlugin', Y.eZ.Plugin.ViewServiceBase, [], {
        initializer: function () {
            this.onHostEvent('*:getImageVariations', this._getImageVariations);
        },

        /**
         * `loadImageVariation` event handler. It uses the JavaScript REST
         * client to load the information about a variation of an image in the
         * field.
         *
         * @method _loadImageVariation
         * @protected
         * @param {Object} e event facade of the loadImageVariation event
         */
        _getImageVariations: function (e) {
            var config = this.get('host').get('config'),
                variations = [],
                callback = e.callback ? e.callback : undefined;

            if (config && config.imageVariations) {
                variations = Object.keys(config.imageVariations).map(function (identifier) {
                    return {
                        identifier: identifier,
                        name: identifier, // TODO put the real name as soon as variations get real name
                    };
                });
                variations.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
            }

            if (callback) callback(variations);
        },
    }, {
        NS: 'landingPageViewServices',
    });

    Y.eZ.PluginRegistry.registerPlugin(
        Y.eZ.Plugin.LandingPageViewServices, ['dynamicLandingPageCreatorViewService', 'dynamicLandingPageEditorViewService']
    );

    Y.eZ.PluginRegistry.registerPlugin(
        Y.eZ.Plugin.Search, ['dynamicLandingPageEditorViewService', 'dynamicLandingPageCreatorViewService']
    );
});