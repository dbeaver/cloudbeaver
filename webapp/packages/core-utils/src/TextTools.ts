/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface IGetWidthOptions {
  font: string;
  container?: HTMLElement;
  text: string[];
}

export const TextTools = {
  getWidth({ font, container, text }: IGetWidthOptions): number[] {
    if (container) {
      const fontTags = ['font-weight', 'font-size', 'font-family'];
      const styleDeclaration = window.getComputedStyle(container);
      const fontValues = fontTags.map(fontValue => fontValue === 'font-family' ? styleDeclaration.getPropertyValue(fontValue).split(',')[0] : styleDeclaration.getPropertyValue(fontValue));

      if (fontValues.filter(v => v !== '').length === fontTags.length) {
        font = fontValues.join(' ');
      }
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;

    return text.map(value => context.measureText(value).width);
  },
};
