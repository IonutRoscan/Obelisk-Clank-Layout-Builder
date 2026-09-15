/**
 * Core Utilities & Clank Integration
 *
 * Provides shared functionality used throughout the extension.
 *
 * This module contains low-level helpers that are not owned by any
 * particular tool or UI component. Most other Obelisk modules should
 * be able to rely on these functions without needing to know how
 * Clank's editor or Markdown pipeline works internally.
 *
 * Responsibilities:
 *
 *   HTML escaping
 *     Safely converts user-provided text before placing it inside
 *     generated HTML or Obelisk interface markup.
 *
 *   Toast notifications
 *     Displays small success/error messages used throughout Obelisk.
 *
 *   Clank editor discovery
 *     Finds the character profile's "Edit about" textarea.
 *
 *   HTML normalization
 *     Prevents Clank's Markdown parser from accidentally interpreting
 *     generated component markup as indented code blocks.
 *
 *   Component insertion
 *     Places generated Obelisk markup into the editor while preserving
 *     cursor position and triggering the input events Clank expects.
 *
 * Exposes:
 *   window.Obelisk.core
 *
 * Loaded before:
 *   content.js
 */


(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Text safety

    /**
     * Escapes text before it is inserted into generated HTML.
     *
     * Tool values frequently come directly from user input. Escaping them
     * prevents characters such as <, > and quotes from unexpectedly breaking
     * the surrounding component markup.
     */

    const escapeHTML =
        value =>
            String(
                value ?? ''
            )
                .replace(
                    /&/g,
                    '&amp;'
                )
                .replace(
                    /</g,
                    '&lt;'
                )
                .replace(
                    />/g,
                    '&gt;'
                )
                .replace(
                    /"/g,
                    '&quot;'
                )
                .replace(
                    /'/g,
                    '&#039;'
                );


    // Generated-markup capture

    // Studio can reuse the exact generators from the compact Obelisk panel.
    // While capture is active, injectText() returns generated markup to Studio
    // instead of mutating Clank's editor, and tool toasts are suppressed.
    let generatedMarkupCapture = null;

    const captureGeneratedMarkup = callback => {
        const previous = generatedMarkupCapture;
        const capture = {
            fragments: [],
            silentToasts: true
        };

        generatedMarkupCapture = capture;

        try {
            callback?.();
            return capture.fragments.join('\n');
        } finally {
            generatedMarkupCapture = previous;
        }
    };


    // Notifications

    /**
     * Displays a temporary Obelisk notification.
     *
     * Only one toast is kept on screen at a time. This prevents rapid tool
     * actions from creating a stack of overlapping notifications.
     *
     * Supported types currently include:
     *   success
     *   error
     */

    const showToast =
        (
            message,
            type = 'success'
        ) => {

            if (generatedMarkupCapture?.silentToasts) {
                return;
            }

            document
                .querySelectorAll(
                    '.obelisk-toast'
                )
                .forEach(
                    existing => {
                        existing.remove();
                    }
                );


            const toast =
                document.createElement(
                    'div'
                );


            toast.className =
                `obelisk-toast obelisk-toast-${type}`;


            toast.innerHTML = `
                <span class="obelisk-toast-mark">
                    ${type === 'error' ? '!' : '◆'}
                </span>

                <span class="obelisk-toast-text">
                    ${escapeHTML(message)}
                </span>
            `;


            document.body.appendChild(
                toast
            );


            requestAnimationFrame(
                () => {

                    toast.classList.add(
                        'obelisk-toast-visible'
                    );
                }
            );


            setTimeout(
                () => {

                    toast.classList.remove(
                        'obelisk-toast-visible'
                    );


                    setTimeout(
                        () => {

                            toast.remove();
                        },
                        250
                    );
                },
                2400
            );
        };


    // Clank HTML normalization

    /**
     * Normalizes generated HTML before it reaches Clank's About editor.
     *
     * COMPAT:
     * Clank passes the About field through a Markdown parser before the
     * generated HTML is rendered.
     *
     * Markdown can interpret lines beginning with indentation as code blocks,
     * especially when blank lines appear between nested elements. Obelisk tool
     * templates are intentionally formatted and indented for source-code
     * readability, so that behavior previously caused parts of components to
     * appear as escaped <pre><code> blocks.
     *
     * Removing indentation and blank lines here lets tool source stay readable
     * while the final inserted component remains one continuous HTML block.
     */

    const sanitizeMarkdownHtml =
        value =>
            String(
                value ?? ''
            )
                .split('\n')
                .map(
                    line =>
                        line.trim()
                )
                .filter(
                    line =>
                        line.length > 0
                )
                .join('\n');


    // Clank editor discovery

    /**
     * Finds the character profile's main "Edit about" textarea.
     *
     * WHY:
     * Character edit pages can contain multiple text fields. Selecting the
     * first textarea on the page can therefore insert generated markup into
     * the wrong field.
     *
     * The About editor's placeholder is currently the most reliable hook
     * available to Obelisk.
     *
     * COMPAT:
     * If Clank changes this placeholder in the future, update or extend this
     * selector here rather than teaching individual tools about Clank markup.
     */

    const findAboutEditor =
        () =>
            document.querySelector(
                'textarea[placeholder*="Write about your character"]'
            );


    // Editor insertion

    /**
     * Inserts text into an editable DOM element at its current selection.
     *
     * Textareas and inputs receive a normal bubbling input event so frameworks
     * listening for controlled-field changes can detect the new value.
     *
     * Contenteditable elements use the browser's text insertion command and
     * receive an InputEvent describing the change.
     */

    const insertIntoElement =
        (
            element,
            text
        ) => {

            if (
                element.tagName ===
                    'TEXTAREA' ||
                element.tagName ===
                    'INPUT'
            ) {

                const start =
                    element.selectionStart ??
                    element.value.length;


                const end =
                    element.selectionEnd ??
                    element.value.length;


                element.value =
                    element.value.slice(
                        0,
                        start
                    ) +
                    text +
                    element.value.slice(
                        end
                    );


                element.selectionStart =
                    start +
                    text.length;


                element.selectionEnd =
                    start +
                    text.length;


                element.dispatchEvent(
                    new Event(
                        'input',
                        {
                            bubbles: true
                        }
                    )
                );


                return;
            }


            if (
                element.isContentEditable
            ) {

                document.execCommand(
                    'insertText',
                    false,
                    text
                );


                element.dispatchEvent(
                    new InputEvent(
                        'input',
                        {
                            bubbles: true,

                            inputType:
                                'insertText',

                            data:
                                text
                        }
                    )
                );
            }
        };


    /**
     * Inserts generated component markup into the most appropriate editor.
     *
     * Selection order:
     *
     *   1. Clank's known About editor.
     *   2. The currently focused editable element.
     *   3. Any textarea/contenteditable element as a compatibility fallback.
     *   4. Clipboard if no usable editor can be found.
     *
     * WHY:
     * Tools should only need to call injectText(). They should never need to
     * know how Clank's editor is discovered, how Markdown is normalized or
     * which DOM events need to be dispatched after insertion.
     */

    const injectText =
        rawText => {

            if (!rawText) {
                return;
            }


            const text =
                sanitizeMarkdownHtml(
                    rawText
                );


            if (generatedMarkupCapture) {
                generatedMarkupCapture.fragments.push(text);
                return text;
            }


            const aboutEditor =
                findAboutEditor();


            if (aboutEditor) {

                insertIntoElement(
                    aboutEditor,
                    text
                );


                showToast(
                    'Component inserted.'
                );


                return;
            }


            const active =
                document.activeElement;


            if (
                active &&
                (
                    active.tagName ===
                        'TEXTAREA' ||

                    active.tagName ===
                        'INPUT' ||

                    active.isContentEditable
                )
            ) {

                insertIntoElement(
                    active,
                    text
                );


                showToast(
                    'Component inserted.'
                );


                return;
            }


            const editor =
                document.querySelector(
                    'textarea'
                ) ||
                document.querySelector(
                    '[contenteditable="true"]'
                );


            if (editor) {

                insertIntoElement(
                    editor,
                    text
                );


                showToast(
                    'Component inserted.'
                );


                return;
            }


            // COMPAT:
            // Copy the generated component when the page no longer exposes
            // an editor Obelisk recognizes. This still gives the user access
            // to their generated markup instead of silently losing it.

            navigator.clipboard
                ?.writeText(
                    text
                )
                .then(
                    () => {

                        showToast(
                            'Copied component to clipboard.'
                        );
                    }
                )
                .catch(
                    () => {

                        showToast(
                            'Could not find the editor.',
                            'error'
                        );
                    }
                );
        };


    /**
     * Replaces the full About editor value and dispatches the input event
     * Clank expects from its controlled textarea.
     */

    const setAboutEditorValue =
        (
            rawText,
            options = {}
        ) => {

            const editor =
                findAboutEditor();

            if (!editor) {
                showToast(
                    'Could not find the Edit about editor.',
                    'error'
                );

                return false;
            }

            /*
             * Full-document replacement is intentionally NOT normalized by
             * default. Existing About content may contain meaningful Markdown
             * blank lines or indentation that must survive a canvas wrap.
             */
            const text =
                options.sanitize
                    ? sanitizeMarkdownHtml(rawText)
                    : String(rawText ?? '');

            editor.value =
                text;

            editor.selectionStart =
                text.length;

            editor.selectionEnd =
                text.length;

            editor.dispatchEvent(
                new Event(
                    'input',
                    { bubbles: true }
                )
            );

            return true;
        };


    /**
     * Wraps the entire current About document inside opening/closing markup.
     * This is used by Profile Canvas so users can theme an existing profile
     * without manually moving all of their HTML into a new container.
     */

    const wrapAboutContent =
        (
            openingMarkup,
            closingMarkup = '</div>'
        ) => {

            const editor =
                findAboutEditor();

            if (!editor) {
                showToast(
                    'Could not find the Edit about editor.',
                    'error'
                );

                return false;
            }

            const opening =
                sanitizeMarkdownHtml(
                    openingMarkup
                );

            const closing =
                sanitizeMarkdownHtml(
                    closingMarkup
                );

            const current =
                String(
                    editor.value || ''
                ).trim();

            const wrapped =
                current
                    ? `${opening}\n${current}\n${closing}`
                    : `${opening}\n${closing}`;

            if (!setAboutEditorValue(wrapped)) {
                return false;
            }

            showToast(
                current
                    ? 'Current profile wrapped in canvas.'
                    : 'Empty profile canvas created.'
            );

            return true;
        };


    // Public core API

    window.Obelisk.core = {

        escapeHTML,

        showToast,

        sanitizeMarkdownHtml,

        findAboutEditor,

        insertIntoElement,

        injectText,

        captureGeneratedMarkup,

        setAboutEditorValue,

        wrapAboutContent

    };

})();