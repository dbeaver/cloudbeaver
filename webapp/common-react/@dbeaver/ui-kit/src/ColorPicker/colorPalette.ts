/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ColorInfo {
  label: string;
  rgb: string;
}

export const COLOR_PALETTE: ColorInfo[][] = [
  // Row 1: Grayscale
  [
    { label: 'black', rgb: 'rgb(0, 0, 0)' },
    { label: 'dark gray 4', rgb: 'rgb(67, 67, 67)' },
    { label: 'dark gray 3', rgb: 'rgb(102, 102, 102)' },
    { label: 'dark gray 2', rgb: 'rgb(153, 153, 153)' },
    { label: 'dark gray 1', rgb: 'rgb(183, 183, 183)' },
    { label: 'gray', rgb: 'rgb(204, 204, 204)' },
    { label: 'light gray 1', rgb: 'rgb(217, 217, 217)' },
    { label: 'light gray 2', rgb: 'rgb(239, 239, 239)' },
    { label: 'light gray 3', rgb: 'rgb(243, 243, 243)' },
    { label: 'white', rgb: 'rgb(255, 255, 255)' },
  ],
  // Row 2: Primary colors
  [
    { label: 'red berry', rgb: 'rgb(152, 0, 0)' },
    { label: 'red', rgb: 'rgb(255, 0, 0)' },
    { label: 'orange', rgb: 'rgb(255, 153, 0)' },
    { label: 'yellow', rgb: 'rgb(255, 255, 0)' },
    { label: 'green', rgb: 'rgb(0, 255, 0)' },
    { label: 'cyan', rgb: 'rgb(0, 255, 255)' },
    { label: 'cornflower blue', rgb: 'rgb(74, 134, 232)' },
    { label: 'blue', rgb: 'rgb(0, 0, 255)' },
    { label: 'purple', rgb: 'rgb(153, 0, 255)' },
    { label: 'magenta', rgb: 'rgb(255, 0, 255)' },
  ],
  // Row 3: Light 3
  [
    { label: 'light red berry 3', rgb: 'rgb(230, 184, 175)' },
    { label: 'light red 3', rgb: 'rgb(244, 204, 204)' },
    { label: 'light orange 3', rgb: 'rgb(252, 229, 205)' },
    { label: 'light yellow 3', rgb: 'rgb(255, 242, 204)' },
    { label: 'light green 3', rgb: 'rgb(217, 234, 211)' },
    { label: 'light cyan 3', rgb: 'rgb(208, 224, 227)' },
    { label: 'light cornflower blue 3', rgb: 'rgb(201, 218, 248)' },
    { label: 'light blue 3', rgb: 'rgb(207, 226, 243)' },
    { label: 'light purple 3', rgb: 'rgb(217, 210, 233)' },
    { label: 'light magenta 3', rgb: 'rgb(234, 209, 220)' },
  ],
  // Row 4: Light 2
  [
    { label: 'light red berry 2', rgb: 'rgb(221, 126, 107)' },
    { label: 'light red 2', rgb: 'rgb(234, 153, 153)' },
    { label: 'light orange 2', rgb: 'rgb(249, 203, 156)' },
    { label: 'light yellow 2', rgb: 'rgb(255, 229, 153)' },
    { label: 'light green 2', rgb: 'rgb(182, 215, 168)' },
    { label: 'light cyan 2', rgb: 'rgb(162, 196, 201)' },
    { label: 'light cornflower blue 2', rgb: 'rgb(164, 194, 244)' },
    { label: 'light blue 2', rgb: 'rgb(159, 197, 232)' },
    { label: 'light purple 2', rgb: 'rgb(180, 167, 214)' },
    { label: 'light magenta 2', rgb: 'rgb(213, 166, 189)' },
  ],
  // Row 5: Light 1
  [
    { label: 'light red berry 1', rgb: 'rgb(204, 65, 37)' },
    { label: 'light red 1', rgb: 'rgb(224, 102, 102)' },
    { label: 'light orange 1', rgb: 'rgb(246, 178, 107)' },
    { label: 'light yellow 1', rgb: 'rgb(255, 217, 102)' },
    { label: 'light green 1', rgb: 'rgb(147, 196, 125)' },
    { label: 'light cyan 1', rgb: 'rgb(118, 165, 175)' },
    { label: 'light cornflower blue 1', rgb: 'rgb(109, 158, 235)' },
    { label: 'light blue 1', rgb: 'rgb(111, 168, 220)' },
    { label: 'light purple 1', rgb: 'rgb(142, 124, 195)' },
    { label: 'light magenta 1', rgb: 'rgb(194, 123, 160)' },
  ],
  // Row 6: Dark 1
  [
    { label: 'dark red berry 1', rgb: 'rgb(166, 28, 0)' },
    { label: 'dark red 1', rgb: 'rgb(204, 0, 0)' },
    { label: 'dark orange 1', rgb: 'rgb(230, 145, 56)' },
    { label: 'dark yellow 1', rgb: 'rgb(241, 194, 50)' },
    { label: 'dark green 1', rgb: 'rgb(106, 168, 79)' },
    { label: 'dark cyan 1', rgb: 'rgb(69, 129, 142)' },
    { label: 'dark cornflower blue 1', rgb: 'rgb(60, 120, 216)' },
    { label: 'dark blue 1', rgb: 'rgb(61, 133, 198)' },
    { label: 'dark purple 1', rgb: 'rgb(103, 78, 167)' },
    { label: 'dark magenta 1', rgb: 'rgb(166, 77, 121)' },
  ],
  // Row 7: Dark 2
  [
    { label: 'dark red berry 2', rgb: 'rgb(133, 32, 12)' },
    { label: 'dark red 2', rgb: 'rgb(153, 0, 0)' },
    { label: 'dark orange 2', rgb: 'rgb(180, 95, 6)' },
    { label: 'dark yellow 2', rgb: 'rgb(191, 144, 0)' },
    { label: 'dark green 2', rgb: 'rgb(56, 118, 29)' },
    { label: 'dark cyan 2', rgb: 'rgb(19, 79, 92)' },
    { label: 'dark cornflower blue 2', rgb: 'rgb(17, 85, 204)' },
    { label: 'dark blue 2', rgb: 'rgb(11, 83, 148)' },
    { label: 'dark purple 2', rgb: 'rgb(53, 28, 117)' },
    { label: 'dark magenta 2', rgb: 'rgb(116, 27, 71)' },
  ],
  // Row 8: Dark 3
  [
    { label: 'dark red berry 3', rgb: 'rgb(91, 15, 0)' },
    { label: 'dark red 3', rgb: 'rgb(102, 0, 0)' },
    { label: 'dark orange 3', rgb: 'rgb(120, 63, 4)' },
    { label: 'dark yellow 3', rgb: 'rgb(127, 96, 0)' },
    { label: 'dark green 3', rgb: 'rgb(39, 78, 19)' },
    { label: 'dark cyan 3', rgb: 'rgb(12, 52, 61)' },
    { label: 'dark cornflower blue 3', rgb: 'rgb(28, 69, 135)' },
    { label: 'dark blue 3', rgb: 'rgb(7, 55, 99)' },
    { label: 'dark purple 3', rgb: 'rgb(32, 18, 77)' },
    { label: 'dark magenta 3', rgb: 'rgb(76, 17, 48)' },
  ],
];
