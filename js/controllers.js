/**
 * Runtime Controllers
 *
 * Contains page-level interaction controllers used by Obelisk-generated
 * or previewed components.
 *
 * Currently provides the legacy Spinning Photo Plane controller.
 *
 * Modern Photo Planes use the hosted iframe viewer and do not require
 * this controller after insertion. It remains for:
 *
 *   - interactive Photo Plane previews inside Obelisk
 *   - backwards compatibility with older inserted Photo Planes
 *
 * The hosted viewer owns its own mouse, touch and zoom behavior.
 *
 * Exposes:
 *   window.Obelisk.controllers
 */

(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    window.Obelisk.controllers =
        window.Obelisk.controllers || {};


    // SAFETY:
    // Prevent duplicate document-level listeners if this module is ever
    // evaluated more than once in the same frame.

    if (
        window.Obelisk.controllers
            .legacyPhotoPlaneLoaded
    ) {
        return;
    }


    window.Obelisk.controllers
        .legacyPhotoPlaneLoaded =
        true;


    // Legacy Photo Plane controller

const obeliskSpinState = {
    plane: null,
    startX: 0,
    startY: 0,
    startTransform: '',
    dragging: false
};

const getObeliskPlane = target => {
    if (!(target instanceof Element)) {
        return null;
    }

    return target.closest(
        '[data-obelisk-plane]'
    );
};

const stopObeliskPlaneAnimation = plane => {
    if (!plane) {
        return;
    }

    /*
     * Read the transform BEFORE disabling animation.
     *
     * This freezes the plane at exactly the angle it was
     * displaying when the user grabbed it.
     */
    const computed =
        getComputedStyle(plane).transform;

    plane.style.animation = 'none';

    plane.style.transform =
        computed === 'none'
            ? ''
            : computed;

    return plane.style.transform;
};

const handleObeliskPointerDown = event => {

    /*
     * Only react to the primary pointer.
     *
     * This covers:
     * - mouse
     * - one-finger touch
     * - pen/stylus
     *
     * Secondary touch points are ignored for now.
     */
    if (event.isPrimary === false) {
    return;
    }

    /*
    * Touch input is handled by the dedicated touch
    * controller below.
    *
    * Mouse and pen continue using Pointer Events.
    */
    if (event.pointerType === 'touch') {
        return;
    }

    const plane =
        getObeliskPlane(event.target);

    if (!plane) {
        return;
    }

    /*
     * Ignore secondary mouse buttons.
     */
    if (
        event.pointerType === 'mouse' &&
        event.button !== 0
    ) {
        return;
    }

    /*
     * For touch input, make sure the browser does not
     * interpret the gesture as ordinary page interaction.
     *
     * The plane already uses touch-action:none, but
     * keeping this here makes the controller defensive.
     */
    if (
        event.pointerType === 'touch'
    ) {
        event.preventDefault();
    } else {
        event.preventDefault();
    }

    /*
     * Store the plane being manipulated.
     */
    obeliskSpinState.plane =
        plane;

    /*
     * Store the starting pointer position.
     *
     * These coordinates work for both mouse and touch.
     */
    obeliskSpinState.startX =
        event.clientX;

    obeliskSpinState.startY =
        event.clientY;

    /*
     * Freeze the automatic animation and remember
     * the current transform.
     */
    obeliskSpinState.startTransform =
        stopObeliskPlaneAnimation(
            plane
        );

    obeliskSpinState.dragging =
        true;

    /*
     * Mouse gets the grabbing cursor.
     * Touch devices don't need a cursor change.
     */
    if (
        event.pointerType === 'mouse'
    ) {
        plane.style.cursor =
            'grabbing';
    }

    /*
     * Keep receiving pointer movement even if the
     * finger/mouse leaves the plane.
     */
    plane.setPointerCapture?.(
        event.pointerId
    );
};

const handleObeliskPointerMove = event => {

    const plane =
        obeliskSpinState.plane;

    if (
        !plane ||
        !obeliskSpinState.dragging
    ) {
        return;
    }

    if (event.isPrimary === false) {
        return;
    }

    event.preventDefault();

    const dx =
        event.clientX -
        obeliskSpinState.startX;

    const dy =
        event.clientY -
        obeliskSpinState.startY;

    /*
     * ------------------------------------------------------------
     * HORIZONTAL ROTATION
     * ------------------------------------------------------------
     */

    const rotationY =
        dx * 0.5;

    /*
     * ------------------------------------------------------------
     * VERTICAL ROTATION
     * ------------------------------------------------------------
     */

    const verticalEnabled =
        plane.dataset.obeliskVerticalDrag === 'true';

    const rotationX =
        verticalEnabled
            ? dy * -0.35
            : 0;

    /*
     * ------------------------------------------------------------
     * APPLY ROTATION
     * ------------------------------------------------------------
     */

    plane.style.transform =
        `${
            obeliskSpinState.startTransform
        } rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
};

const handleObeliskWheel = event => {

    const plane =
        getObeliskPlane(event.target);

    if (!plane) {
        return;
    }

    /*
     * Zoom must be explicitly enabled for this plane.
     */
    if (
        plane.dataset.obeliskZoom !== 'true'
    ) {
        return;
    }

    event.preventDefault();

    /*
     * Read the current zoom level.
     *
     * We store it directly on the DOM element so each
     * plane keeps its own zoom independently.
     */
    const currentZoom =
        parseFloat(
            plane.dataset.obeliskZoomLevel || '1'
        );

    /*
     * Wheel up:
     *     deltaY < 0
     *     zoom in
     *
     * Wheel down:
     *     deltaY > 0
     *     zoom out
     */
    const direction =
        event.deltaY < 0
            ? 1
            : -1;

    /*
     * Gentle zoom increments.
     */
    const zoomStep =
        0.1;

    let newZoom =
        currentZoom +
        direction * zoomStep;

    /*
     * Keep zoom within sensible limits.
     *
     * 0.6 = zoomed out
     * 2.5 = zoomed in
     */
    newZoom =
        Math.max(
            0.6,
            Math.min(
                2.5,
                newZoom
            )
        );

    plane.dataset.obeliskZoomLevel =
        String(newZoom);

    /*
     * We don't replace the existing rotation.
     *
     * Instead, we modify the current transform by
     * adding scale().
     *
     * This keeps the image, border, and both faces
     * together.
     */
    const currentTransform =
        plane.style.transform;

    /*
     * Remove any previous scale() from the transform
     * before applying the new zoom.
     */
    const withoutScale =
        currentTransform
            .replace(
                /\s*scale\([^)]*\)/g,
                ''
            );

    plane.style.transform =
        `${withoutScale} scale(${newZoom})`;
};

/*
 * ============================================================
 * TOUCH CONTROLLER
 * ============================================================
 *
 * One-finger touch:
 *
 *     left / right  -> rotate Y
 *
 * If Vertical Drag is enabled:
 *
 *     up / down     -> rotate X
 *
 * Mouse interaction continues to use Pointer Events above.
 * ============================================================
 */

const handleObeliskTouchStart = event => {

    /*
     * We only want one finger for this first experiment.
     *
     * Two fingers will be ignored for now.
     */
    if (
        event.touches.length !== 1
    ) {
        return;
    }

    const plane =
        getObeliskPlane(event.target);

    if (!plane) {
        return;
    }

    event.preventDefault();

    const touch =
        event.touches[0];

    obeliskSpinState.plane =
        plane;

    obeliskSpinState.startX =
        touch.clientX;

    obeliskSpinState.startY =
        touch.clientY;

    obeliskSpinState.startTransform =
        stopObeliskPlaneAnimation(
            plane
        );

    obeliskSpinState.dragging =
        true;

    /*
     * Remember that Touch Events are currently
     * controlling the plane.
     */
    plane.dataset.obeliskTouchActive =
        'true';
};


const handleObeliskTouchMove = event => {

    const plane =
        obeliskSpinState.plane;

    if (
        !plane ||
        !obeliskSpinState.dragging ||
        plane.dataset.obeliskTouchActive !== 'true'
    ) {
        return;
    }

    /*
     * Only one finger.
     */
    if (
        event.touches.length !== 1
    ) {
        return;
    }

    event.preventDefault();

    const touch =
        event.touches[0];

    const dx =
        touch.clientX -
        obeliskSpinState.startX;

    const dy =
        touch.clientY -
        obeliskSpinState.startY;

    /*
     * Horizontal rotation.
     */
    const rotationY =
        dx * 0.5;

    /*
     * Vertical rotation.
     *
     * Only active when the user enabled
     * Vertical Drag.
     */
    const verticalEnabled =
        plane.dataset.obeliskVerticalDrag === 'true';

    const rotationX =
        verticalEnabled
            ? dy * -0.35
            : 0;

    plane.style.transform =
        `${
            obeliskSpinState.startTransform
        } rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
};


const handleObeliskTouchEnd = event => {

    const plane =
        obeliskSpinState.plane;

    if (
        !plane ||
        plane.dataset.obeliskTouchActive !== 'true'
    ) {
        return;
    }

    /*
     * Capture the final position exactly like
     * the normal mouse controller does.
     */
    const finalTransform =
        getComputedStyle(plane).transform;

    if (
        finalTransform !== 'none'
    ) {
        plane.style.transform =
            finalTransform;
    }

    plane.dataset.obeliskTouchActive =
        'false';

    obeliskSpinState.plane =
        null;

    obeliskSpinState.dragging =
        false;
};

const finishObeliskDrag = event => {
    const plane =
        obeliskSpinState.plane;

    if (!plane) {
        return;
    }

    /*
     * Capture the final computed transform so the next
     * drag starts from exactly where the previous drag ended.
     */
    const finalTransform =
        getComputedStyle(plane).transform;

    if (finalTransform !== 'none') {
        plane.style.transform =
            finalTransform;
    }

    plane.style.cursor = 'grab';

    try {
        if (
            event?.pointerId != null &&
            plane.hasPointerCapture?.(
                event.pointerId
            )
        ) {
            plane.releasePointerCapture(
                event.pointerId
            );
        }
    } catch (_) {
        // Nothing to do if capture was already released.
    }

    obeliskSpinState.plane = null;
    obeliskSpinState.dragging = false;
};

document.addEventListener(
    'touchstart',
    handleObeliskTouchStart,
    {
        capture: true,
        passive: false
    }
);

document.addEventListener(
    'touchmove',
    handleObeliskTouchMove,
    {
        capture: true,
        passive: false
    }
);

document.addEventListener(
    'touchend',
    handleObeliskTouchEnd,
    {
        capture: true,
        passive: false
    }
);

document.addEventListener(
    'touchcancel',
    handleObeliskTouchEnd,
    {
        capture: true,
        passive: false
    }
);

/*
 * Use CAPTURE phase.
 *
 * This lets Obelisk see the pointer event before ordinary
 * page-level handlers get a chance to interfere with it.
 */
document.addEventListener(
    'pointerdown',
    handleObeliskPointerDown,
    true
);

document.addEventListener(
    'pointermove',
    handleObeliskPointerMove,
    true
);

document.addEventListener(
    'pointerup',
    finishObeliskDrag,
    true
);

document.addEventListener(
    'pointercancel',
    finishObeliskDrag,
    true
);

document.addEventListener(
    'lostpointercapture',
    finishObeliskDrag,
    true
);

document.addEventListener(
    'wheel',
    handleObeliskWheel,
    {
        capture: true,
        passive: false
    }
);

})();