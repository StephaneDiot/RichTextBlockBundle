/*
 * Copyright (C) eZ Systems AS. All rights reserved.
 * For full copyright and license information view LICENSE file distributed with this source code.
 */
YUI.add('ezs-richtextfieldview', function (Y) {
    'use strict';

    Y.namespace('eZS');

    var L = Y.Lang,
        FOCUS_CLASS = 'is-focused',
        EDITOR_FOCUSED_CLASS = 'is-editor-focused',
        EDITABLE_CLASS = 'ez-richtext-editable',
        AlloyEditor = Y.eZ.AlloyEditor,
        ToolbarConfig = Y.eZ.AlloyEditorToolbarConfig,

        ATTR_FIELD_TYPE = 'data-field-type',
        ATTR_FIELD_ID = 'data-field-id',
        CLASS_FIELD = 'ezs-field',
        CLASS_INLINE = 'ezs-is-inline',
        CLASS_DISABLED = 'ezs-is-disabled',
        CLASS_FIELD_ERROR = CLASS_FIELD + '--has-error',
        CLASS_FIELD_EMPTY = CLASS_FIELD + '--is-empty',
        CLASS_FIELDVIEW = 'ez-view-studiofieldview',
        SELECTOR_DATA_INPUT = '[data-input]',
        SELECTOR_DATA_INPUT_VALID = '[data-input-validation]',
        SELECTOR_ERROR_MESSAGE = '.ezs-field__error';

    /**
     * The Block Edit Field view
     *
     * @namespace eZS
     * @class FieldView
     * @constructor
     * @extends eZ.TemplateBasedView
     * @uses eZ.Processable
     */
    Y.eZS.RichTextFieldView = Y.Base.create('studioRichTextFieldView', Y.eZS.FieldView, [Y.eZ.Processable], {
        events: {
            '.ez-richtext-switch-focus': {
                'tap': '_setFocusMode',
            },
            '.ez-richtext-save-and-return': {
                'tap': '_unsetFocusMode',
            }
        },

        initializer: function () {
            var config = this.get('config'),
                field = {id: this.get('id'), fieldValue: ""};

            this.set('field', field);

            if (config && config.rootInfo && config.rootInfo.ckeditorPluginPath) {
                this._set('ckeditorPluginPath', config.rootInfo.ckeditorPluginPath);
            }

            this.after('focusModeChange', this._uiFocusMode);
            this._processEvent = ['instanceReady', 'updatedEmbed'];
            this.on('popupDisplayedChange', this._onPopupDisplayedChange, this);
            this.on('disabledChange', this._toggleDisableField, this);
            this.on('isDataValidChange', this._toggleErrorIndicator, this);
            this.on('isEmptyChange', this._toggleFieldEmptyErrorIndicator, this);
            this.on('refresh', this._refreshFieldView, this);
        },

        /**
         * Renders the action
         * DO NOT OVERWRITE! Overwrite _render() instead.
         *
         * @method render
         * @return {eZS.FieldView} the view itself
         */
        render: function () {
            var container = this.get('container'),
                values = this._serializeFieldValue(),
                inputs,
                templateAttrs = this.getAttrs();

            templateAttrs.id = templateAttrs.prefix + '-' + templateAttrs.id.toLowerCase();

            if (templateAttrs.required) {
                templateAttrs.name = templateAttrs.name + '*';
            }

            container.addClass(CLASS_FIELDVIEW).setHTML(this.template(templateAttrs));
            container.addClass(this._generateViewClassName(this._getName()));
            container.setAttribute(ATTR_FIELD_TYPE, this.get('type'));
            container.setAttribute(ATTR_FIELD_ID, this.get('id'));

            inputs = container.all(SELECTOR_DATA_INPUT);

            inputs.empty();

            if (templateAttrs.inline) {
                container.addClass(CLASS_INLINE);
            }

            if (templateAttrs.disabled) {
                container.addClass(CLASS_DISABLED);
            }

            if (values.length) {
                inputs.each(function (input) {
                    input.setHTML(values);
                });

                this.set('isEmpty', false);
                this.set('isDataValid', true);
            }

            this._render();

            return this;
        },

        _render: function () {
            return this;
        },

        _onPopupDisplayedChange: function(e, displayed){
            var editor = this.get('editor');
            if(displayed && !editor){
                this._initEditor();
            }
        },

        /**
         * Updates the values in the input fields
         *
         * @protected
         * @method _refreshFieldView
         */
        _refreshFieldView: function () {
            var inputs = this.get('container').all(SELECTOR_DATA_INPUT),
                values = this._serializeFieldValue(),
                editor = this.get('editor');

            if (values.length) {
                inputs.each(function (input) {
                    input.setHTML(values);
                });
                if(editor) editor.get('nativeEditor').fire('updatedEmbed');
                this.validate();
            }
        },

        /**
         * Validates data from the field. Updates the view state according to the validation status.
         *
         * @protected
         * @method _validateData
         * @return {Boolean}
         */
        _validateData: function (event) {
            var isDataValid = true;
            if ( !this.get('required') && this._isEmpty() ) {
                isDataValid = false;
            }

            if (isDataValid) {
                var values = this._getXHTML5EditValue();
                this.set('values', values);
            }

            return isDataValid;
        },

        /** RICHTEXT METHODS **/

        /**
         * `focusModeChange` event handler, it adds or removes the focused
         * class on the view container.
         *
         * @method _uiFocusMode
         * @protected
         */
        _uiFocusMode: function () {
            var container = this.get('container');

            if (this.get('focusMode')) {
                container.addClass(FOCUS_CLASS);
            } else {
                container.removeClass(FOCUS_CLASS);
            }
        },

        /**
         * tap event handler on the focus button.
         *
         * @method _setFocusMode
         * @protected
         * @param {EventFacade} e
         */
        _setFocusMode: function (e) {
            e.preventDefault();
            this._set('focusMode', true);
        },

        /**
         * tap event handler on the save and return button.
         *
         * @method _unsetFocusMode
         * @protected
         * @param {EventFacade} e
         */
        _unsetFocusMode: function (e) {
            e.preventDefault();
            this._set('focusMode', false);
        },

        /**
         * Returns an objects (`name` and `identifier`) representing the image
         * variations configured in Platform sorted by name.
         *
         * @method _getImageVariations
         * @return Array
         */
        _getImageVariations: function () {
            var config = this.get('config'),
                variations = [];

            if (!config || !config.imageVariations) {
                return variations;
            }
            variations = Object.keys(config.imageVariations).map(function (identifier) {
                return {
                    identifier: identifier,
                    name: identifier, // TODO put the real name as soon as variations get real name
                };
            });
            return variations.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        },

        /**
         * Registers the plugin which name is given in the given plugin dir.
         *
         * @method _registerExternalCKEditorPlugin
         * @protected
         */
        _registerExternalCKEditorPlugin: function (pluginName, pluginDir) {
            CKEDITOR.plugins.addExternal(pluginName, this.get('ckeditorPluginPath') + '/' + pluginDir);
        },

        /**
         * Initializes the editor
         *
         * @protected
         * @method _initEditor
         */
        _initEditor: function () {
            var editor, nativeEd, valid, setEditorFocused, unsetEditorFocused,
                extraPlugins = [
                    'ezaddcontent', 'widget', 'ezembed', 'ezremoveblock',
                    'ezfocusblock', 'yui3', 'ezpaste', 'ezmoveelement',
                ];

            this._registerExternalCKEditorPlugin('widget', 'widget/');
            this._registerExternalCKEditorPlugin('lineutils', 'lineutils/');
            editor = AlloyEditor.editable(
                this.get('container').one('.ez-richtext-editor').getDOMNode(), {
                    toolbars: this.get('toolbarsConfig'),
                    extraPlugins: AlloyEditor.Core.ATTRS.extraPlugins.value + ',' + extraPlugins.join(','),
                    removePlugins: AlloyEditor.Core.ATTRS.removePlugins.value + ',ae_embed',
                    eZ: {
                        editableRegion: '.' + EDITABLE_CLASS,
                        imageVariations: this._getImageVariations(),
                    },
                }
            );

            nativeEd = editor.get('nativeEditor');

            this.fire('getImageVariations', {
                callback: Y.bind(function (variations) {
                    nativeEd.config.eZ.imageVariations = variations;
                }, this),
            });


            valid = Y.bind(this.validate, this);
            setEditorFocused = Y.bind(this._uiHandleEditorFocus, this, true);
            unsetEditorFocused = Y.bind(this._uiHandleEditorFocus, this, false);

            Y.Array.each(this.get('forwardEvents'), function (evtName) {
                nativeEd.on(evtName, Y.bind(this._forwardEditorEvent, this));
            }, this);

            nativeEd.on('blur', valid);
            nativeEd.on('focus', valid);
            nativeEd.on('change', valid);
            nativeEd.on('focus', setEditorFocused);
            nativeEd.on('blur', unsetEditorFocused);
            this._set('editor', editor);
        },

        /**
         * Forwards the given event to the YUI stack
         *
         * @method _forwardEditorEvent
         * @param {Object} e the CKEditor event info
         * @protected
         */
        _forwardEditorEvent: function (e) {
            this.fire(e.name, e.data);
        },

        /**
         * Adds or removes the editor focused class on the view container.
         *
         * @method _uiHandleEditorFocus
         * @param {Boolean} focus
         */
        _uiHandleEditorFocus: function (focus) {
            var container = this.get('container');

            if (focus) {
                container.addClass(EDITOR_FOCUSED_CLASS);
            } else {
                container.removeClass(EDITOR_FOCUSED_CLASS);
            }
        },

        /**
         * Checks whether the field is empty. The field is considered empty if:
         *   * there's no section element
         *   * or the section element has no child
         *   * or the section element has only child without content
         *
         * @method _isEmpty
         * @protected
         * @return {Boolean}
         */
        _isEmpty: function () {
            var section = Y.Node.create(this._getXHTML5EditValue()),
                hasChildNodes = function (element) {
                    return !!element.get('children').size();
                },
                hasChildWithContent = function (element) {
                    return element.get('children').some(function (node) {
                        return L.trim(node.get('text')) !== '';
                    });
                },
                hasEmbedElement = function(element) {
                    return !!element.one('[data-ezelement=ezembed]');
                };

            return !section || !hasChildNodes(section) || !(hasChildWithContent(section) || hasEmbedElement(section));
        },
        /**
         * Returns a DocumentFragment object or null if the parser failed to
         * load the xhtml5edit version of the rich text field. The document
         * fragment only contains the content of the root <section> element.
         *
         * @method _getHTMLDocumentFragment
         * @return {DocumentFragment}
         */
        _getHTMLDocumentFragment: function () {
            var fragment = Y.config.doc.createDocumentFragment(),
                root = fragment.ownerDocument.createElement('div'),
                values = this.get('values'),
                doc = (new DOMParser()).parseFromString(values, "text/xml"),
                importChildNodes = function (parent, element, skipElement) {
                    // recursively import element and its descendants under
                    // parent this allows to correctly transform an `xhtml5edit`
                    // document (it's an XML document) to an HTML document a
                    // browser can understand.
                    var i, newElement;

                    if ( skipElement ) {
                        newElement = parent;
                    } else {
                        if ( element.nodeType === Node.ELEMENT_NODE ) {
                            newElement = parent.ownerDocument.createElement(element.localName);
                            for (i = 0; i != element.attributes.length; i++) {
                                importChildNodes(newElement, element.attributes[i], false);
                            }
                            parent.appendChild(newElement);
                        } else if ( element.nodeType === Node.TEXT_NODE ) {
                            parent.appendChild(parent.ownerDocument.createTextNode(element.nodeValue));
                            return;
                        } else if ( element.nodeType === Node.ATTRIBUTE_NODE ) {
                            parent.setAttribute(element.localName, element.value);
                            return;
                        } else {
                            return;
                        }
                    }
                    for (i = 0; i != element.childNodes.length; i++) {
                        importChildNodes(newElement, element.childNodes[i], false);
                    }
                };

            if ( !doc || !doc.documentElement || doc.querySelector("parsererror") ) {
                return null;
            }

            fragment.appendChild(root);

            importChildNodes(root, doc.documentElement, true);
            return fragment;
        },

        /**
         * Serializes the Document to a string
         *
         * @method _serializeFieldValue
         * @protected
         * @return {String}
         */
        _serializeFieldValue: function () {
            var doc = this._getHTMLDocumentFragment(), section;

            if (!doc) {
                return "";
            }
            section = doc.childNodes.item(0);
            if (!section.hasChildNodes()) {
                // making sure to have at least a paragraph element
                // otherwise CKEditor adds a br to make sure the editor can put
                // the caret inside the element.
                doc.childNodes.item(0).appendChild(Y.config.doc.createElement('p'));
            }
            return section.innerHTML;
        },

        /**
         * Returns the content of the editor in the XHTML5Edit format. The
         * actual editor's content is passed through a set of
         * EditorContentProcessors.
         *
         * @method _getXHTML5EditValue
         * @protected
         * @return {String}
         */
        _getXHTML5EditValue: function () {
            if(this.get('editor') != null){
                var data = this.get('editor').get('nativeEditor').getData();

                Y.Array.each(this.get('editorContentProcessors'), function (processor) {
                    data = processor.process(data);
                });
                return [data];
            }
            return this.get('values');

        }
    }, {
        ATTRS: {
            /**
             * The field being displayed
             *
             * @attribute field
             * @type {}
             */
            field: {},

            xhtml: {
                getter : function(val, name){
                    return this._serializeFieldValue();
                }
            },
            editableClass: {
                value: EDITABLE_CLASS,
            },

            processors: {
                writeOnce: 'initOnly',
                valueFn: function () {
                    return [{
                        processor: new Y.eZ.RichTextResolveImage(),
                        priority: 100,
                    }, {
                        processor: new Y.eZ.RichTextResolveEmbed(),
                        priority: 50,
                    }];
                },
            },

            /**
             * Stores the focus mode state. When true, the rich text UI is
             * supposed to be fullscreen with an action bar on the right.
             *
             * @attribute focusMode
             * @type {Boolean}
             * @readOnly
             */
            focusMode: {
                value: false,
                readOnly: true,
            },

            /**
             * The AlloyEditor
             *
             * @attribute editor
             * @type AlloyEditor.Core
             */
            editor: {
                value: null,
                readOnly: true,
            },

            /**
             * AlloyEditor toolbar configuration
             *
             * @attribute toolbarsConfig
             * @type {Object}
             */
            toolbarsConfig: {
                value: {
                    styles: {
                        selections: [
                            ToolbarConfig.Link,
                            ToolbarConfig.Text,
                            ToolbarConfig.Table,
                            new ToolbarConfig.HeadingConfig(),
                            new ToolbarConfig.ParagraphConfig(),
                            ToolbarConfig.Image,
                            ToolbarConfig.Embed,
                        ],
                        tabIndex: 1
                    },
                    ezadd: {
                        buttons: ['ezheading', 'ezparagraph', 'ezlist', 'ezlistindexed', 'ezimage', 'ezembed', 'eztable'],
                        tabIndex: 2,
                    },
                }
            },

            /**
             * The path to use to load the CKEditor plugins
             *
             * @attribute ckeditorPluginPath
             * @readOnly
             * @type {String}
             * @default '/bundles/ezplatformuiassets/vendors'
             */
            ckeditorPluginPath: {
                value: '/bundles/ezplatformuiassets/vendors',
                readOnly: true,
            },

            /**
             * Editor events to forward to the YUI stack
             *
             * @attribute forwardEvents
             * @readOnly
             * @type {Array}
             * @default ['contentDiscover', 'loadImageVariation', 'contentSearch', 'instanceReady', 'updatedEmbed']
             */
            forwardEvents: {
                value: ['contentDiscover', 'loadImageVariation', 'contentSearch', 'instanceReady', 'updatedEmbed'],
                readOnly: true,
            },

            /**
             * Hold the list of editor content processors. Those components
             * should have a `process` method and are there to clean up the
             * editor content before using it through REST.
             *
             * @attribute editorContentProcessors
             * @type Array of {eZ.EditorContentProcessor}
             */
            editorContentProcessors: {
                valueFn: function () {
                    return [
                        new Y.eZ.EditorContentProcessorRemoveIds(),
                        new Y.eZ.EditorContentProcessorEmptyEmbed(),
                        new Y.eZ.EditorContentProcessorRemoveAnchors(),
                        new Y.eZ.EditorContentProcessorXHTML5Edit(),
                    ];
                },
            },

            /**
             * The type of the field
             *
             * @attribute type
             * @type String
             * @default 'richtext'
             */
            type: {
                value: 'richtext'
            },
        }
    });
});
