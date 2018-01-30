
YUI.add('ezs-landingpagebasicsviewplugin', function (Y) {
    "use strict";
    /**
     * @module ezs-landingpagebasicsviewplugin
     */
    Y.namespace('eZ.Plugin');

    /**
     *
     * @namespace eZ.Plugin
     * @class LandingPageCreatorView
     * @constructor
     * @extends Plugin.Base
     */
    Y.eZ.Plugin.LandingPageBasicsView = Y.Base.create('landingPageBasicsViewPlugin', Y.Plugin.Base, [], {
        initializer: function () {
            var host = this.get('host'),
                fieldDescription = host.get('fieldDescription');

            fieldDescription.set('required', false);
        },

    }, {
        NS: 'landingPageBasicsViewPlugin',
    });

    Y.eZ.PluginRegistry.registerPlugin(
        Y.eZ.Plugin.LandingPageBasicsView, ['studioLandingPageBasicsView']
    );
});