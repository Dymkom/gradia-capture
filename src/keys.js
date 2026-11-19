/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * keys.js - Keyboard-layout independent shortcut matching.
 * Resolves Clutter key events to predictable keyvals across non-Latin and
 * alternative keyboard layouts by falling back to physical US-QWERTY keycode
 * positions when the active layout does not produce printable ASCII.
 */

import Clutter from 'gi://Clutter';

// [xkb keycode of the row's first key, characters of that row on US-QWERTY]
const ROWS = [
    [10, '1234567890'],
    [24, 'qwertyuiop'],
    [38, 'asdfghjkl'],
    [52, 'zxcvbnm'],
];

const POSITIONAL = new Map();
for (const [firstKeycode, chars] of ROWS) {
    [...chars].forEach((ch, i) => {
        POSITIONAL.set(firstKeycode + i, Clutter[`KEY_${ch}`]);
    });
}

const isPrintableAscii = sym => sym >= 0x20 && sym <= 0x7e;

/**
 * @param {Clutter.Event} event - a key press/release event
 * @returns {number} keyval to compare against Clutter.KEY_* constants
 */
export function shortcutKeyval(event) {
    const sym = event.get_key_symbol();
    if (isPrintableAscii(sym))
        return sym;
    return POSITIONAL.get(event.get_key_code()) ?? sym;
}
