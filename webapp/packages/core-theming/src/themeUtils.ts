/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ClassCollection {
  [key: string]: string;
}

export class Composes {
  composes: ClassCollection;
  styles?: ClassCollection;
  constructor(composes: ClassCollection, styles?: ClassCollection) {
    this.composes = composes;
    this.styles = styles;
  }
}

/**
 * @deprecated Not needed anymore
 */
export function composes(composes: ClassCollection, styles?: ClassCollection) {
  return new Composes(composes, styles);
}

/**
 * @deprecated Not needed anymore
 */
export function applyComposes(mixed: Array<Composes | ClassCollection>) {
  const composes: Composes[] = [];
  const styles: ClassCollection[] = [];

  for (const value of mixed) {
    if (value instanceof Composes) {
      if (value.styles) {
        styles.push(value.styles);
      }
      composes.push(value);
    } else {
      styles.push(value);
    }
  }

  return [
    ...styles,
    ...composes.map(compose => Object.entries(compose.composes).reduce<ClassCollection>(
      (map, [key, value]) => {
        const classes = value.split(' ');
        const classnames: string[] = [];

        while (classes.length > 0) {
          const classname = classes.shift()!;

          for (let i = styles.length - 1; i >= 0; i--) {
            const test = styles[i][classname];
            if (test) {
              classnames.push(test);
              break;
            }
          }
        }

        // eslint-disable-next-line no-param-reassign
        map[key] = classnames.join(' ');
        return map;
      },
      {}
    )),
  ];
}
