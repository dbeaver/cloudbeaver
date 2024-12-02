/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { combineConfig, Compartment, EditorState, type Extension, Facet, Range, SelectionRange, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

import { Hyperlink, HyperlinkState } from './Hyperlink.js';
import type { HyperlinkLoader } from './HyperlinkLoader.js';
import type { IHyperlinkInfo } from './IHyperlinkInfo.js';

export interface HyperlinksConfig {
  loadLinkInfo: HyperlinkLoader;
}

export const hyperlinksConfig = Facet.define<HyperlinksConfig, Required<HyperlinksConfig>>({
  combine(configs) {
    return combineConfig<Required<HyperlinksConfig>>(configs, {
      loadLinkInfo: () => Promise.resolve(null),
    });
  },
});

const metaKeyStateEffect = StateEffect.define<boolean>();
const hoverPositionEffect = StateEffect.define<number | null>();
const addHyperlinkEffect = StateEffect.define<Range<Hyperlink>>();
const updateHyperlinkEffect = StateEffect.define<[Hyperlink, IHyperlinkInfo | null]>();

const modKeyState = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(metaKeyStateEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

const hoverPositionState = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(hoverPositionEffect)) {
        return effect.value;
      }
    }
    return value;
  },
});

const linksState = StateField.define({
  create: () => Hyperlink.none,
  update(hyperlinks, tr) {
    hyperlinks = hyperlinks.map(tr.changes);
    const isMetaKey = tr.state.field(modKeyState);

    if (!isMetaKey) {
      return hyperlinks.size === 0 ? hyperlinks : Hyperlink.none;
    }

    for (const effect of tr.effects) {
      if (effect.is(addHyperlinkEffect)) {
        return hyperlinks.update({
          add: [effect.value],
        });
      }

      if (effect.is(updateHyperlinkEffect)) {
        return hyperlinks.update({
          filter: (from, to, hyperlink) => {
            if (hyperlink === effect.value[0]) {
              hyperlink.state = HyperlinkState.Result;
              hyperlink.hyperlink = effect.value[1];
            }
            return true;
          },
        });
      }
    }

    return hyperlinks;
  },
  provide: linksState =>
    EditorView.decorations.compute([linksState, hoverPositionState], state => {
      const hoverCursor = state.field(hoverPositionState);
      const hyperlinks = state.field(linksState).update({ filter: (from, to) => !!hoverCursor && from <= hoverCursor && hoverCursor <= to });

      const iter = hyperlinks.iter();
      const decorations = [];

      while (iter.value) {
        const hyperlink = iter.value;
        const link = hyperlink.hyperlink;

        if (link) {
          decorations.push(
            Decoration.mark({
              class: 'cm-link cm-link-loaded',
              attributes: { title: link.tooltip || '' },
              link,
            }).range(iter.from, iter.to),
          );
        } else {
          decorations.push(
            Decoration.mark({
              class: 'cm-link cm-link-loading',
            }).range(iter.from, iter.to),
          );
        }

        iter.next();
      }

      return Decoration.set(decorations);
    }),
});

const hyperlinkPlugin = ViewPlugin.fromClass(
  class {
    private pendingUpdate: ReturnType<typeof setTimeout> | null = null;
    constructor(public view: EditorView) {}

    update(update: ViewUpdate) {
      const isMetaKey = update.state.field(modKeyState);

      if (isMetaKey) {
        this.scheduleLinkInfoLoad();
      } else {
        this.resetLinkInfoLoad();
      }
    }

    private scheduleLinkInfoLoad() {
      this.resetLinkInfoLoad();

      this.pendingUpdate = setTimeout(() => {
        this.pendingUpdate = null;

        const position = this.getHoveredWordPosition(this.view.state);

        if (position === null) {
          return;
        }

        const links = this.view.state.field(linksState);
        const config = this.view.state.facet(hyperlinksConfig);

        let hyperlink: Hyperlink | null = null;
        links.between(position.from, position.to, (from, to, h) => {
          if (from === position.from && to === position.to) {
            hyperlink = h;
          }
        });

        if (!hyperlink) {
          hyperlink = Hyperlink.create();
          this.view.dispatch({ effects: addHyperlinkEffect.of(hyperlink!.range(position.from, position.to)) });
        }

        if (hyperlink.state === HyperlinkState.Inactive) {
          hyperlink.state = HyperlinkState.Pending;

          config
            .loadLinkInfo(position)
            .then(link => {
              this.view.dispatch({ effects: updateHyperlinkEffect.of([hyperlink!, link]) });
            })
            .catch(() => {
              this.view.dispatch({ effects: updateHyperlinkEffect.of([hyperlink!, null]) });
            });
        }
      }, 100);
    }

    private resetLinkInfoLoad() {
      if (this.pendingUpdate) {
        clearTimeout(this.pendingUpdate);
        this.pendingUpdate = null;
      }
    }

    private getHoveredWordPosition(state: EditorState): SelectionRange | null {
      const position = state.field(hoverPositionState);

      if (position === null) {
        return null;
      }

      return state.wordAt(position);
    }
  },
  {
    eventHandlers: {
      keydown: (event, view) => {
        if (event.key === 'Meta') {
          view.dispatch({ effects: [metaKeyStateEffect.of(true)] });
        }
      },
      keyup: (event, view) => {
        if (event.key === 'Meta') {
          view.dispatch({ effects: metaKeyStateEffect.of(false) });
        }
      },
      mousedown(event, view) {
        try {
          const linksSet = view.state.field(linksState);
          const target = event.target as HTMLElement;
          const pos = view.posAtDOM(target);

          const iterator = linksSet.iter(pos);
          const hyperlink = iterator.value;

          if (hyperlink) {
            const link = hyperlink.hyperlink;

            if (link) {
              link.onClick();
            }
          }
        } catch {}
      },
      mousemove: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        view.dispatch({ effects: [hoverPositionEffect.of(pos), metaKeyStateEffect.of(event.metaKey)] });
      },
    },
  },
);

const EDITOR_AUTOCOMPLETION_COMPARTMENT = new Compartment();
export function useHyperlink(config: HyperlinksConfig): [Compartment, Extension] {
  return [EDITOR_AUTOCOMPLETION_COMPARTMENT, [hyperlinkPlugin, modKeyState, hoverPositionState, linksState, hyperlinksConfig.of(config)]];
}
