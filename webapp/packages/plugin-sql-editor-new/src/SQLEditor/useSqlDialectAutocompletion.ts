/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import { createComplexLoader, useComplexLoader, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { GlobalConstants } from '@cloudbeaver/core-utils';
import type { Compartment, Completion, CompletionConfig, CompletionContext, CompletionResult, Extension } from '@cloudbeaver/plugin-codemirror6';
import { type ISQLEditorData, type SQLProposal } from '@cloudbeaver/plugin-sql-editor';

const codemirrorComplexLoader = createComplexLoader(() => import('@cloudbeaver/plugin-codemirror6'));

type SqlCompletion = Completion & {
  icon?: string;
};

const CLOSE_CHARACTERS = /[\s()[\]{};:>,=\\*]/;
const COMPLETION_WORD = /[\w*]*/;

export function useSqlDialectAutocompletion(data: ISQLEditorData): [Compartment, Extension] {
  const { closeCompletion, useEditorAutocompletion, insertCompletionText } = useComplexLoader(codemirrorComplexLoader);
  const localizationService = useService(LocalizationService);
  const optionsRef = useObjectRef({ data });

  const [config] = useState<CompletionConfig>(() => {
    function getOptionsFromProposals(explicit: boolean, word: string, proposals: SQLProposal[]): SqlCompletion[] {
      const wordLowerCase = word.toLocaleLowerCase();
      const hasSameName = proposals.some(
        ({ replacementString, displayString }) =>
          sanitizeProposal(displayString) === wordLowerCase || replacementString.toLocaleLowerCase() === wordLowerCase,
      );
      const filteredProposals = proposals
        .filter(
          ({ replacementString, displayString }) => {
            const display = sanitizeProposal(displayString);
            const replacement = replacementString.toLocaleLowerCase();

            return word === '*' ||
              (display !== wordLowerCase && display.startsWith(wordLowerCase)) ||
              (replacement !== wordLowerCase && replacement.startsWith(wordLowerCase));
          }
        )
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      if (filteredProposals.length === 0 && !hasSameName && explicit) {
        return [
          {
            apply: closeCompletion,
            label: localizationService.translate('sql_editor_hint_empty'),
          },
        ];
      }

      return [
        ...filteredProposals.map<SqlCompletion>(proposal => ({
          label: proposal.displayString,
          apply: (view, completion, from, to) => {
            view.dispatch(insertCompletionText(view.state, proposal.replacementString, proposal.replacementOffset, to));
          },
          boost: proposal.score,
          icon: proposal.icon,
        })),
      ];
    }

    async function completionSource(context: CompletionContext): Promise<CompletionResult | null> {
      if (context.matchBefore(CLOSE_CHARACTERS) && !context.explicit) {
        return null;
      }

      const word = context.matchBefore(COMPLETION_WORD);

      if (word === null) {
        return null;
      }

      try {
        const startPos = context.pos;
        const proposals = await optionsRef.data.getHintProposals(startPos, !context.explicit);
        const limitIsMet = optionsRef.data.hintsLimitIsMet;

        const result: CompletionResult = {
          from: word.from,
          options: getOptionsFromProposals(context.explicit, word.text, proposals),
          update(current, from, to, context) {
            if (startPos > context.pos) {
              return null;
            }

            if (current.options.some(option => option.apply === closeCompletion)) {
              return null;
            }

            if (limitIsMet) {
              return null;
            }

            if (context.matchBefore(CLOSE_CHARACTERS) && !context.explicit) {
              return null;
            }

            const word = context.matchBefore(COMPLETION_WORD);

            if (word === null) {
              return null;
            }

            return {
              ...current,
              options: getOptionsFromProposals(context.explicit, word.text, proposals),
            };
          },
          filter: false,
        };

        if (result.options.length === 0) {
          return null;
        }

        return result;
      } catch {
        return null;
      }
    }

    return {
      override: [completionSource],
      addToOptions: [
        {
          render(completion: SqlCompletion) {
            const icon = document.createElement('img');
            icon.classList.add('cm-completionIcon');
            icon.setAttribute('aria-hidden', 'true');

            if (completion.icon) {
              icon.setAttribute('src', GlobalConstants.absoluteUrl(completion.icon));
            }

            return icon;
          },
          position: 20,
        },
      ],
      icons: false, // disable native symbol based icons
    };
  });

  return useEditorAutocompletion(config);
}

function sanitizeProposal(value: string): string {
  return value.replace(/^"|"$/g, '').toLocaleLowerCase();
}