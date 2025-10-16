/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2024 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */

export function getDiagramBackgroundColor(node: HTMLElement | SVGSVGElement | Element) {
  return window.getComputedStyle(node).getPropertyValue('background-color');
}

export function excludeElements(parentNode: SVGSVGElement, selector: string) {
  const targets = parentNode.querySelectorAll(selector);

  targets.forEach(e => {
    e.remove();
  });
}

function preprocessClassesToStyles(node: SVGSVGElement) {
  const containerElements: string[] = ['svg', 'g', 'defs', 'marker', 'symbol'];
  const relevantStyles: Record<string, string[]> = {
    rect: ['fill', 'stroke', 'stroke-width', 'width', 'height', 'transform-box', 'transform-origin'],
    path: ['fill', 'stroke', 'stroke-width', 'stroke-dashoffset', 'stroke-dasharray'],
    circle: ['fill', 'stroke', 'stroke-width'],
    line: ['stroke', 'stroke-width'],
    text: ['fill', 'font-size', 'font-family', 'text-anchor', 'font-weight'],
    polygon: ['stroke', 'fill'],
    use: ['fill', 'color'],
  };

  for (const child of Array.from(node.childNodes as NodeListOf<SVGSVGElement>)) {
    const tagName = child.tagName;

    if (containerElements.includes(tagName)) {
      preprocessClassesToStyles(child);
    } else if (tagName in relevantStyles) {
      for (const attribute of Array.from(child.attributes)) {
        const hasVariable = attribute.value.includes('var(') && attribute.value.includes(')');
        const isRelevantAttribute = relevantStyles[tagName]!.includes(attribute.name);
        const varName = extractVariableValue(attribute.value);
        const computedValue = getComputedStyle(document.body).getPropertyValue(varName).trim();

        if (hasVariable && isRelevantAttribute && computedValue) {
          child.setAttribute(attribute.name, computedValue);
        }
      }

      const styleDeclaration = window.getComputedStyle(child);

      let styleString = child.style.cssText;
      const initialKeys = styleString
        .split(';')
        .slice(0, -1)
        .map(style => style.split(':')[0]);

      const style = relevantStyles[tagName]!;
      for (let st = 0; st < style.length; st++) {
        const key = style[st]!;

        if (!initialKeys.includes(key)) {
          styleString = styleString += key + ':' + styleDeclaration.getPropertyValue(key) + '; ';
        }
      }
      child.setAttribute('style', styleString);
    }
  }
}

function extractVariableValue(value: string): string {
  if (value.startsWith('var(') && value.endsWith(')')) {
    return value.slice(4, -1).trim();
  }

  return value;
}

export function transformClassesToStyles(el: SVGSVGElement): void {
  // Make element part of DOM to get correct dimensions and styles
  el.style.display = 'none';
  document.body.appendChild(el);

  preprocessClassesToStyles(el);

  // Removes element from DOM to not affect current document
  document.body.removeChild(el);
  el.style.removeProperty('display');
}
