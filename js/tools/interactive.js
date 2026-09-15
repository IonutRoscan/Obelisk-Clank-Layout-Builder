/**
 * Interactive Tools
 *
 * Defines Obelisk tools with richer interactive preview behavior
 * or externally hosted interactive output.
 *
 * Tools in this module:
 *   Spinning Photo Plane
 *   Interactive Hotspot Image
 *   Engine Inspector
 *
 * The hosted Photo Plane and Hotspot viewers are public runtime
 * dependencies used by generated profile components.
 *
 * Extends:
 *   window.Obelisk.tools
 *
 * Depends on:
 *   window.Obelisk.core
 */

(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Module dependencies

    const core =
        window.Obelisk.core;


    if (!core) {

        console.error(
            '[Obelisk] core.js was not loaded before tools/interactive.js.'
        );

        return;
    }


    const {
        escapeHTML,
        showToast,
        injectText
    } = core;


    // Shared tool registry

    window.Obelisk.tools =
        window.Obelisk.tools || [];


    window.Obelisk.tools.push(
        ...[

        // Spinning Photo Plane
        {
            name: '🌀 Spinning Photo Plane',

            fields: [
                {
                    key: 'frontUrl',
                    label: 'Image URL',
                    placeholder: 'https://i.postimg.cc/.../image.png'
                },
                {
                    key: 'title',
                    label: 'Title (optional)',
                    placeholder: 'Enter a title...'
                },
                {
                    key: 'backStyle',
                    label: 'Back Face',
                    type: 'select',
                    options: [
                        { label: 'Same Image (auto-mirrored)', value: 'mirror' },
                        { label: 'Solid Accent Color', value: 'solid' },
                        { label: 'Different Image', value: 'second' }
                    ]
                },
                {
                    key: 'backUrl',
                    label: 'Back Image URL (used when Back Face is "Different Image")',
                    placeholder: 'https://...'
                },
                {
                    key: 'speed',
                    label: 'Spin Speed',
                    type: 'select',
                    options: ['Slow', 'Medium', 'Fast']
                },
                {
                    key: 'verticalDrag',
                    label: 'Vertical Drag',
                    type: 'select',
                    options: ['Off', 'On']
                },
                {
                    key: 'zoom',
                    label: 'Zoom',
                    type: 'select',
                    options: ['Off', 'On']
                }
            ],

            preview: (values, hex) => {

    const speedSeconds =
        values.speed === 'Fast'
            ? 4
            : values.speed === 'Slow'
                ? 14
                : 8;

    const spinName =
        'obelisk-preview-spin';

    const front =
        escapeHTML(
            values.frontUrl.trim()
        );

    const title =
        values.title.trim()
            ? `
                <div style="
                    margin-top:12px;
                    padding:6px 14px;
                    color:${hex};
                    font-size:14px;
                    font-weight:600;
                    text-align:center;
                    letter-spacing:0.5px;
                    line-height:1.3;
                    text-shadow:0 1px 4px rgba(0,0,0,0.8);

                    background:rgba(0,0,0,0.72);
                    border:1px solid ${hex};
                    border-radius:8px;

                    box-shadow:
                        0 4px 12px rgba(0,0,0,0.45);

                    max-width:320px;
                    word-break:break-word;
                    box-sizing:border-box;
                ">
                    ${escapeHTML(
                        values.title.trim()
                    )}
                </div>
            `
            : '';

    const backContent =
        values.backStyle === 'second' &&
        values.backUrl.trim()

            ? `
                <img
                    src="${escapeHTML(
                        values.backUrl.trim()
                    )}"
                    draggable="false"
                    ondragstart="return false;"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:contain;
                        display:block;
                        -webkit-user-drag:none;
                        pointer-events:none;
                    "
                >
            `

            : values.backStyle === 'solid'

                ? `
                    <div style="
                        width:100%;
                        height:100%;
                        background:${hex};
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:2em;
                        color:#000;
                    ">
                        ◆
                    </div>
                `

                : front

                    ? `
                        <img
                            src="${front}"
                            draggable="false"
                            ondragstart="return false;"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:contain;
                                display:block;
                                -webkit-user-drag:none;
                                pointer-events:none;
                            "
                        >
                    `

                    : '';

    return `
        <style>
            @keyframes ${spinName} {
                from {
                    transform:rotateY(0deg);
                }

                to {
                    transform:rotateY(360deg);
                }
            }
        </style>

        <div style="
            display:flex;
            flex-direction:column;
            align-items:center;
            padding:12px 0;
        ">

            <div style="
                perspective:700px;
            ">

                <div
                    data-obelisk-plane
                    data-obelisk-vertical-drag="${
                        values.verticalDrag === 'On'
                            ? 'true'
                            : 'false'
                    }"
                    data-obelisk-zoom="${
                        values.zoom === 'On'
                            ? 'true'
                            : 'false'
                    }"
                    style="
                        width:140px;
                        height:140px;
                        position:relative;
                        transform-style:preserve-3d;
                        animation:${spinName} ${speedSeconds}s linear infinite;
                        cursor:grab;
                        touch-action:none;
                        user-select:none;
                    "
                >

                    <!-- FRONT -->

                    <div style="
                        position:absolute;
                        inset:0;
                        backface-visibility:hidden;
                        border-radius:8px;
                        overflow:hidden;
                        border:2px solid ${hex};
                        background:#000;
                    ">

                        ${
                            front
                                ? `
                                    <img
                                        src="${front}"
                                        draggable="false"
                                        ondragstart="return false;"
                                        onload="
                                            (function(img){
                                                var plane =
                                                    img.closest('[data-obelisk-plane]');

                                                if(!plane) return;

                                                var iw =
                                                    img.naturalWidth;

                                                var ih =
                                                    img.naturalHeight;

                                                if(!iw || !ih) return;

                                                var maxD = 180;

                                                var scale =
                                                    Math.min(
                                                        1,
                                                        maxD / Math.max(iw, ih)
                                                    );

                                                plane.style.width =
                                                    Math.max(
                                                        1,
                                                        Math.round(iw * scale)
                                                    ) + 'px';

                                                plane.style.height =
                                                    Math.max(
                                                        1,
                                                        Math.round(ih * scale)
                                                    ) + 'px';
                                            })(this);
                                        "
                                        style="
                                            width:100%;
                                            height:100%;
                                            object-fit:contain;
                                            display:block;
                                            -webkit-user-drag:none;
                                            pointer-events:none;
                                        "
                                    >
                                `
                                : ''
                        }

                    </div>

                    <!-- BACK -->

                    <div style="
                        position:absolute;
                        inset:0;
                        backface-visibility:hidden;
                        transform:rotateY(180deg);
                        border-radius:8px;
                        overflow:hidden;
                        border:2px solid ${hex};
                        background:#000;
                    ">
                        ${backContent}
                    </div>

                </div>

            </div>

            ${title}

            <div style="
                text-align:center;
                color:${hex};
                font-size:9px;
                opacity:0.8;
                margin-top:6px;
            ">
                Auto-spins, sized to your image. Try dragging it.
            </div>

        </div>
    `;
},

            validate: values => {

                if (!values.frontUrl.trim()) {
                    showToast(
                        'Enter an image URL.',
                        'error'
                    );

                    return false;
                }

                if (
                    values.backStyle === 'second' &&
                    !values.backUrl.trim()
                ) {
                    showToast(
                        'Enter a back image URL, or pick a different Back Face option.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

                        onSubmit: (values, hex) => {

    // HOSTED PHOTO PLANE VIEWER

    const VIEWER =
        'https://ionutroscan.github.io/photo-plane-viewer/';


    const params =
        new URLSearchParams();


    // FRONT IMAGE

    params.set(
        'front',
        values.frontUrl.trim()
    );


    // BACK FACE

    params.set(
        'backStyle',
        values.backStyle || 'mirror'
    );


    if (
        values.backStyle === 'second' &&
        values.backUrl.trim()
    ) {
        params.set(
            'back',
            values.backUrl.trim()
        );
    }


    // APPEARANCE

    params.set(
        'color',
        hex
    );


    params.set(
        'speed',
        values.speed || 'Medium'
    );


    // INTERACTION

    params.set(
        'vertical',
        values.verticalDrag === 'On'
            ? 'true'
            : 'false'
    );


    params.set(
        'zoom',
        values.zoom === 'On'
            ? 'true'
            : 'false'
    );


    // OPTIONAL TITLE

    if (
        values.title.trim()
    ) {
        params.set(
            'title',
            values.title.trim()
        );
    }


    // BUILD VIEWER URL

    const viewerUrl =
        `${VIEWER}?${params.toString()}`;


    // INJECT STANDALONE IFRAME

    injectText(`
<div style="
    width:100%;
    max-width:720px;
    height:560px;
    margin:32px auto;
    overflow:hidden;
    border-radius:12px;
">
    <iframe
        title="Interactive Photo Plane"
        src="${escapeHTML(viewerUrl)}"
        width="100%"
        height="100%"
        frameborder="0"
        scrolling="no"
        allow="fullscreen"
        allowtransparency="true"
        style="
            display:block;
            width:100%;
            height:100%;
            border:0;
            background:none transparent !important;
            background-color:rgba(0,0,0,0) !important;
            color-scheme:auto;
        "
    ></iframe>
</div>
`);
}
        },

            // Interactive Hotspot Image
            {
                name: '🗺️ Interactive Hotspot Image',

                fields: [

                    {
                        key: 'imageUrl',
                        label: 'Image URL',
                        placeholder: 'https://i.postimg.cc/.../map.jpg'
                    },

                    {
                        key: 'title',
                        label: 'Image Title (optional)',
                        placeholder: 'WORLD MAP'
                    },

                    {
                        key: 'zoom',
                        label: 'Zoom / Pan',
                        type: 'select',
                        options: [
                            'On',
                            'Off'
                        ]
                    },

                    ...[
                        {
                            number: 1,
                            x: '30',
                            y: '40'
                        },

                        {
                            number: 2,
                            x: '70',
                            y: '30'
                        },

                        {
                            number: 3,
                            x: '35',
                            y: '72'
                        },

                        {
                            number: 4,
                            x: '75',
                            y: '70'
                        }

                    ].flatMap(
                        hotspot => [

                            {
                                key:
                                    `h${hotspot.number}title`,

                                label:
                                    `Hotspot ${hotspot.number} — Title`,

                                placeholder:
                                    hotspot.number === 1
                                        ? 'Old Chapel'
                                        : 'Optional'
                            },

                            {
                                key:
                                    `h${hotspot.number}text`,

                                label:
                                    `Hotspot ${hotspot.number} — Description`,

                                type:
                                    'textarea',

                                placeholder:
                                    hotspot.number === 1
                                        ? 'Nobody enters after sunset.'
                                        : 'Optional lore...',

                                rows:
                                    2
                            },

                            {
                                key:
                                    `h${hotspot.number}x`,

                                label:
                                    `Hotspot ${hotspot.number} — Horizontal Position`,

                                type:
                                    'range',

                                min:
                                    0,

                                max:
                                    100,

                                step:
                                    1,

                                default:
                                    hotspot.x
                            },

                            {
                                key:
                                    `h${hotspot.number}y`,

                                label:
                                    `Hotspot ${hotspot.number} — Vertical Position`,

                                type:
                                    'range',

                                min:
                                    0,

                                max:
                                    100,

                                step:
                                    1,

                                default:
                                    hotspot.y
                            }

                        ]
                    )

                ],


                // PREVIEW

                            preview: (values, hex) => {

                const clampPosition =
                    value => {

                        const number =
                            parseFloat(
                                value
                            );

                        if (
                            !Number.isFinite(
                                number
                            )
                        ) {
                            return 50;
                        }

                        return Math.max(
                            0,
                            Math.min(
                                100,
                                number
                            )
                        );
                    };


                const markers =
                    [1, 2, 3, 4]
                        .map(
                            index => {

                                const hotspotTitle =
                                    (
                                        values[
                                            `h${index}title`
                                        ] ||
                                        ''
                                    ).trim();


                                if (
                                    !hotspotTitle
                                ) {
                                    return '';
                                }


                                const x =
                                    clampPosition(
                                        values[
                                            `h${index}x`
                                        ]
                                    );


                                const y =
                                    clampPosition(
                                        values[
                                            `h${index}y`
                                        ]
                                    );


                                return `
                                    <span
                                        data-obelisk-hotspot-marker="${index}"
                                        title="${escapeHTML(
                                            hotspotTitle
                                        )}"
                                        style="
                                            position:absolute;

                                            left:${x}%;
                                            top:${y}%;

                                            width:22px;
                                            height:22px;

                                            display:grid;
                                            place-items:center;

                                            transform:
                                                translate(
                                                    -50%,
                                                    -50%
                                                );

                                            color:#fff;

                                            background:${hex};

                                            border:
                                                2px solid
                                                rgba(
                                                    255,
                                                    255,
                                                    255,
                                                    0.92
                                                );

                                            border-radius:50%;

                                            box-shadow:
                                                0 0 0 3px ${hex}33,
                                                0 0 14px ${hex};

                                            font-size:9px;
                                            font-weight:900;

                                            line-height:1;

                                            pointer-events:none;

                                            z-index:5;
                                        "
                                    >
                                        ${index}
                                    </span>
                                `;
                            }
                        )
                        .join('');


                const activeCount =
                    [1, 2, 3, 4]
                        .filter(
                            index =>
                                (
                                    values[
                                        `h${index}title`
                                    ] ||
                                    ''
                                ).trim()
                        )
                        .length;


                const imageUrl =
                    (
                        values.imageUrl ||
                        ''
                    ).trim();


                const imageTitle =
                    (
                        values.title ||
                        ''
                    ).trim();


                return `
                    <div style="
                        padding:10px;

                        background:#0b0d10;

                        border:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                0.08
                            );

                        border-radius:10px;
                    ">

                        ${
                            imageTitle
                                ? `
                                    <div style="
                                        margin-bottom:8px;

                                        color:${hex};

                                        font-size:10px;
                                        font-weight:800;

                                        letter-spacing:1px;
                                    ">
                                        ${escapeHTML(
                                            imageTitle
                                        )}
                                    </div>
                                `
                                : ''
                        }


                        <!-- HOTSPOT SELECTOR -->

                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:center;

                            gap:6px;

                            margin-bottom:9px;
                        ">

                            <span style="
                                margin-right:3px;

                                color:#666;

                                font-size:8px;
                                font-weight:800;

                                letter-spacing:1px;
                            ">
                                PLACE
                            </span>

                            ${[1, 2, 3, 4]
                                .map(
                                    index => `
                                        <button
                                            type="button"

                                            data-obelisk-hotspot-select="${index}"

                                            style="
                                                width:27px;
                                                height:27px;

                                                padding:0;

                                                display:grid;
                                                place-items:center;

                                                color:#aaa;

                                                background:#111318;

                                                border:
                                                    1px solid
                                                    rgba(
                                                        255,
                                                        255,
                                                        255,
                                                        0.1
                                                    );

                                                border-radius:6px;

                                                cursor:pointer;

                                                font-size:10px;
                                                font-weight:900;
                                            "
                                        >
                                            ${index}
                                        </button>
                                    `
                                )
                                .join('')}

                        </div>


                        <!-- IMAGE -->

                        <div style="
                            width:100%;

                            display:flex;
                            align-items:center;
                            justify-content:center;

                            overflow:hidden;
                        ">

                            ${
                                imageUrl
                                    ? `
                                        <div
                                            data-obelisk-hotspot-stage

                                            title="Click to place the selected hotspot"

                                            style="
                                                position:relative;

                                                display:inline-block;

                                                max-width:100%;

                                                overflow:hidden;

                                                line-height:0;

                                                background:#050506;

                                                border:
                                                    1px solid
                                                    ${hex}55;

                                                border-radius:8px;

                                                cursor:crosshair;
                                            "
                                        >

                                            <img
                                                data-obelisk-hotspot-image

                                                src="${escapeHTML(
                                                    imageUrl
                                                )}"

                                                draggable="false"

                                                style="
                                                    display:block;

                                                    width:auto;
                                                    height:auto;

                                                    max-width:100%;
                                                    max-height:230px;

                                                    object-fit:contain;

                                                    user-select:none;
                                                    pointer-events:none;
                                                    -webkit-user-drag:none;
                                                "
                                            >

                                            ${markers}

                                        </div>
                                    `
                                    : `
                                        <div style="
                                            width:100%;
                                            height:150px;

                                            display:flex;
                                            align-items:center;
                                            justify-content:center;

                                            color:#555;

                                            background:#050506;

                                            border:
                                                1px solid
                                                ${hex}55;

                                            border-radius:8px;

                                            font-size:9px;
                                            font-weight:800;

                                            letter-spacing:1px;
                                        ">
                                            ENTER IMAGE URL
                                        </div>
                                    `
                            }

                        </div>


                        <div style="
                            margin-top:8px;

                            color:#666;

                            font-size:8px;

                            text-align:center;

                            line-height:1.45;
                        ">
                            Select 1–4 above, then click directly
                            on the image to place that hotspot.
                            <br>
                            ${activeCount}
                            HOTSPOT${
                                activeCount === 1
                                    ? ''
                                    : 'S'
                            }
                            CONFIGURED
                        </div>

                    </div>
                `;
            },

                            // VISUAL HOTSPOT PLACEMENT

            wirePreview: ({
                modal,
                preview,
                updatePreview
            }) => {

                const accentColor =
                    getComputedStyle(
                        modal
                    )
                        .getPropertyValue(
                            '--obelisk-accent'
                        )
                        .trim() ||
                    '#c4a35a';

                /*
                 * Remember which hotspot is currently being
                 * positioned even when the preview gets rebuilt.
                 */
                if (
                    !modal.dataset
                        .obeliskActiveHotspot
                ) {

                    modal.dataset
                        .obeliskActiveHotspot =
                            '1';
                }


                const getActiveHotspot =
                    () =>
                        parseInt(
                            modal.dataset
                                .obeliskActiveHotspot ||
                                '1',
                            10
                        );


                // SELECTOR VISUALS

                const refreshSelector =
                    () => {

                        const active =
                            getActiveHotspot();


                        preview
                            .querySelectorAll(
                                '[data-obelisk-hotspot-select]'
                            )
                            .forEach(
                                button => {

                                    const number =
                                        parseInt(
                                            button.dataset
                                                .obeliskHotspotSelect,
                                            10
                                        );


                                    if (
                                        number ===
                                        active
                                    ) {

                                        button.style.color =
                                            '#fff';

                                        button.style.background =
                                            accentColor;

                                        button.style.borderColor =
                                            accentColor;

                                        button.style.boxShadow =
                                            `0 0 12px ${accentColor}`;

                                    } else {

                                        button.style.color =
                                            '#aaa';

                                        button.style.background =
                                            '#111318';

                                        button.style.borderColor =
                                            'rgba(255,255,255,0.1)';

                                        button.style.boxShadow =
                                            'none';
                                    }
                                }
                            );
                    };


                preview
                    .querySelectorAll(
                        '[data-obelisk-hotspot-select]'
                    )
                    .forEach(
                        button => {

                            button.addEventListener(
                                'click',
                                event => {

                                    event.preventDefault();

                                    event.stopPropagation();


                                    modal.dataset
                                        .obeliskActiveHotspot =
                                            button.dataset
                                                .obeliskHotspotSelect;


                                    refreshSelector();
                                }
                            );
                        }
                    );


                refreshSelector();


                // CLICK IMAGE TO PLACE

                const stage =
                    preview.querySelector(
                        '[data-obelisk-hotspot-stage]'
                    );


                const image =
                    preview.querySelector(
                        '[data-obelisk-hotspot-image]'
                    );


                if (
                    !stage ||
                    !image
                ) {
                    return;
                }


                stage.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        /*
                         * Don't calculate against an image that
                         * hasn't actually loaded yet.
                         */
                        if (
                            !image.complete ||
                            !image.naturalWidth ||
                            !image.naturalHeight
                        ) {

                            showToast(
                                'Wait for the preview image to load.',
                                'error'
                            );

                            return;
                        }


                        const rect =
                            stage.getBoundingClientRect();


                        if (
                            !rect.width ||
                            !rect.height
                        ) {
                            return;
                        }


                        /*
                         * Percentage coordinates relative to the
                         * actual visible image.
                         */
                        const x =
                            Math.max(
                                0,
                                Math.min(
                                    100,
                                    (
                                        (
                                            event.clientX -
                                            rect.left
                                        ) /
                                        rect.width
                                    ) *
                                    100
                                )
                            );


                        const y =
                            Math.max(
                                0,
                                Math.min(
                                    100,
                                    (
                                        (
                                            event.clientY -
                                            rect.top
                                        ) /
                                        rect.height
                                    ) *
                                    100
                                )
                            );


                        const active =
                            getActiveHotspot();


                        const xField =
                            modal.querySelector(
                                `[data-obelisk-field="h${active}x"]`
                            );


                        const yField =
                            modal.querySelector(
                                `[data-obelisk-field="h${active}y"]`
                            );


                        if (
                            !xField ||
                            !yField
                        ) {
                            return;
                        }


                        /*
                         * Sliders currently use whole percentages,
                         * so round to the nearest integer.
                         */
                        xField.value =
                            Math.round(x);

                        yField.value =
                            Math.round(y);


                        // UPDATE RANGE OUTPUT LABELS

                        const xOutput =
                            modal.querySelector(
                                `[data-obelisk-output="h${active}x"]`
                            );


                        const yOutput =
                            modal.querySelector(
                                `[data-obelisk-output="h${active}y"]`
                            );


                        if (xOutput) {

                            xOutput.value =
                                xField.value;

                            xOutput.textContent =
                                xField.value;
                        }


                        if (yOutput) {

                            yOutput.value =
                                yField.value;

                            yOutput.textContent =
                                yField.value;
                        }


                        /*
                         * Rebuild the preview once.
                         *
                         * wirePreview() will automatically be
                         * attached again by the modal system.
                         */
                        updatePreview();
                    }
                );
            },


                // VALIDATION

                validate: values => {

                    if (
                        !values.imageUrl.trim()
                    ) {

                        showToast(
                            'Enter an image URL.',
                            'error'
                        );

                        return false;
                    }


                    const activeHotspots =
                        [1, 2, 3, 4]
                            .filter(
                                index =>
                                    values[
                                        `h${index}title`
                                    ].trim()
                            );


                    if (
                        !activeHotspots.length
                    ) {

                        showToast(
                            'Add at least one hotspot title.',
                            'error'
                        );

                        return false;
                    }


                    for (
                        const index
                        of activeHotspots
                    ) {

                        const x =
                            parseFloat(
                                values[
                                    `h${index}x`
                                ]
                            );


                        const y =
                            parseFloat(
                                values[
                                    `h${index}y`
                                ]
                            );


                        if (
                            !Number.isFinite(x) ||
                            !Number.isFinite(y) ||
                            x < 0 ||
                            x > 100 ||
                            y < 0 ||
                            y > 100
                        ) {

                            showToast(
                                `Hotspot ${index} position must be between 0 and 100.`,
                                'error'
                            );

                            return false;
                        }
                    }


                    return true;
                },


                // INSERT

                onSubmit: (values, hex) => {

                    const VIEWER =
                        'https://ionutroscan.github.io/photo-plane-viewer/hotspot/';


                    const params =
                        new URLSearchParams();


                    // IMAGE

                    params.set(
                        'image',
                        values.imageUrl.trim()
                    );


                    params.set(
                        'color',
                        hex
                    );


                    params.set(
                        'zoom',
                        values.zoom === 'Off'
                            ? 'false'
                            : 'true'
                    );


                    // OPTIONAL TITLE

                    if (
                        values.title.trim()
                    ) {

                        params.set(
                            'title',
                            values.title.trim()
                        );
                    }


                    // HOTSPOTS

                    [1, 2, 3, 4]
                        .forEach(
                            index => {

                                const hotspotTitle =
                                    values[
                                        `h${index}title`
                                    ].trim();


                                if (
                                    !hotspotTitle
                                ) {
                                    return;
                                }


                                params.set(
                                    `h${index}title`,
                                    hotspotTitle
                                );


                                const hotspotText =
                                    values[
                                        `h${index}text`
                                    ].trim();


                                if (
                                    hotspotText
                                ) {

                                    params.set(
                                        `h${index}text`,
                                        hotspotText
                                    );
                                }


                                params.set(
                                    `h${index}x`,
                                    values[
                                        `h${index}x`
                                    ] || '50'
                                );


                                params.set(
                                    `h${index}y`,
                                    values[
                                        `h${index}y`
                                    ] || '50'
                                );
                            }
                        );


                    // VIEWER URL

                    const viewerUrl =
                        `${VIEWER}?${params.toString()}`;


                    // STANDALONE IFRAME

                    injectText(`
    <div style="
        width:100%;
        max-width:760px;
        height:560px;
        margin:32px auto;
        overflow:hidden;
        border-radius:12px;
    ">
        <iframe
            title="Interactive Hotspot Image"
            src="${escapeHTML(viewerUrl)}"
            width="100%"
            height="100%"
            frameborder="0"
            scrolling="no"
            allowtransparency="true"
            style="
                display:block;
                width:100%;
                height:100%;
                border:0;
                background:none transparent !important;
                background-color:rgba(0,0,0,0) !important;
                color-scheme:auto;
            "
        ></iframe>
    </div>
    `);
                }
            },

        // Engine Inspector
        {
            name: '🎮 Engine Inspector',
            fields: [
                { key: 'node', label: 'Node Name', placeholder: 'PlayerCharacter' },
                { key: 'prop1', label: 'Property 1 (e.g. max_health : int)', placeholder: 'max_health : int = 100' },
                { key: 'prop2', label: 'Property 2', placeholder: 'movement_speed : float = 4.5' },
                { key: 'prop3', label: 'Property 3', placeholder: 'is_active : bool = true' }
            ],
            preview: (values, hex) => `
                <div style="background:#202531; color:#ccc; font-family:monospace; padding:8px; font-size:9px;">
                    <div style="background:#2d3342; padding:4px;">▼ ${escapeHTML(values.node || 'Node')}</div>
                    <div style="padding:4px 12px; color:#ff7b72;">${escapeHTML(values.prop1 || 'prop')}</div>
                </div>
            `,
            validate: values => values.node.trim() ? true : (showToast('Enter node name', 'error'), false),
            onSubmit: (values, hex) => {
                const row = (text, bg) => text.trim() ? `
                    <div style="display:flex; justify-content:space-between; background:${bg}; padding:6px 12px; border-bottom:1px solid #1a1e27;">
                        <span style="color:#79c0ff;">${escapeHTML(text.split('=')[0].trim())}</span>
                        <span style="color:#ff7b72;">${escapeHTML((text.split('=')[1] || '').trim())}</span>
                    </div>` : '';
                
                // Uses classic dark engine theme colors
                injectText(`
<div style="margin:24px auto; max-width:400px; background:#0d1117; border:1px solid #30363d; border-radius:6px; font-family:Consolas, 'Courier New', monospace; font-size:0.85em; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
    <div style="background:#161b22; padding:8px 12px; border-bottom:1px solid #30363d; display:flex; align-items:center; gap:8px;">
        <span style="color:${hex}; font-size:1.2em;">⚙</span>
        <strong style="color:#e6edf3; letter-spacing:1px;">Inspector</strong>
    </div>
    
    <div style="background:#21262d; padding:6px 12px; border-bottom:1px solid #30363d; color:#e6edf3; font-weight:bold;">
        ▼ Node: <span style="color:#d2a8ff;">${escapeHTML(values.node.trim())}</span>
    </div>
    
    <div>
        ${row(values.prop1, '#0d1117')}
        ${row(values.prop2, '#161b22')}
        ${row(values.prop3, '#0d1117')}
    </div>
</div>
`);
            }
        },

        ]
    );

})();