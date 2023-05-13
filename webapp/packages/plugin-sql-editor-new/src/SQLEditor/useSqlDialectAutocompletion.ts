/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { GlobalConstants } from '@cloudbeaver/core-utils';
import { Completion, CompletionContext, CompletionResult, UseEditorAutocompletionResult, closeCompletion, useEditorAutocompletion } from '@cloudbeaver/plugin-codemirror6';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

type SqlCompletion = Completion & {
  icon?: string;
};

const CLOSE_CHARACTERS = /[\s()[\]{};:>,=\\*]/;

export function useSqlDialectAutocompletion(data: ISQLEditorData): UseEditorAutocompletionResult {
  const localizationService = useService(LocalizationService);

  async function completionSource(context: CompletionContext): Promise<CompletionResult | null> {
    if (context.matchBefore(CLOSE_CHARACTERS) && !context.explicit) {
      return null;
    }

    const word = context.matchBefore(/[\w*]*/);

    if (word === null) {
      return null;
    }

    try {
      const proposals = await data.getHintProposals(context.pos, word.text, !context.explicit);

      const wordLowerCase = word.text.toLocaleLowerCase();
      const hasSameName = proposals.some(
        ({ displayString }) => displayString.toLocaleLowerCase() === wordLowerCase
      );
      const filteredProposals = proposals.filter(({ displayString }) => (
        word.text === '*'
      || (
        displayString.toLocaleLowerCase() !== wordLowerCase
        && displayString.toLocaleLowerCase().startsWith(wordLowerCase)
      )
      ))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

      const result: CompletionResult = {
        from: word.from,
        options: [
          ...filteredProposals.map<SqlCompletion>(proposal => ({
            label: proposal.displayString,
            apply: proposal.replacementString,
            boost: proposal.score,
            icon: proposal.icon,
          })),
        ],
        filter: false,
      };

      if (result.options.length === 0 && !hasSameName && context.explicit) {
        result.options = [{
          apply: closeCompletion,
          label: localizationService.translate('sql_editor_hint_empty'),
        }];
      }

      if (result.options.length === 0) {
        return null;
      }

      return result;
    } catch {
      return null;
    }
  }

  return useEditorAutocompletion({
    override: [completionSource],
    addToOptions: [{
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
    }],
    icons: false, // disable native symbol based icons
  });
}