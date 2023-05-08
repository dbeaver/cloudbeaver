/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { CompletionContext, CompletionResult, UseEditorAutocompletionResult, useEditorAutocompletion } from '@cloudbeaver/plugin-codemirror6';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

const CLOSE_CHARACTERS = /[\s()[\]{};:>,=\\*]/;

export function useSqlDIalectAutocompletion(data: ISQLEditorData): UseEditorAutocompletionResult {
  const localizationService = useService(LocalizationService);

  async function completionSource(context: CompletionContext): Promise<CompletionResult | null> {
    if (context.matchBefore(CLOSE_CHARACTERS) && !context.explicit) {
      return null;
    }

    const word = context.matchBefore(/[\w*]*/);

    if (word === null) {
      return null;
    }

    const proposals = await data.getHintProposals(context.pos, word.text, !context.explicit);

    const workLowerCase = word.text.toLocaleLowerCase();
    const hasSameName = proposals.some(
      ({ displayString }) => displayString.toLocaleLowerCase() === workLowerCase
    );
    const filteredProposals = proposals.filter(({ displayString }) => (
      word.text === '*'
      || (
        displayString.toLocaleLowerCase() !== workLowerCase
        && displayString.toLocaleLowerCase().startsWith(workLowerCase)
      )
    ))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    const result: CompletionResult = {
      from: word.from,
      options: [
        ...filteredProposals.map(proposal => ({
          label: proposal.displayString,
          // type: proposal.type,
          apply: proposal.replacementString,
          boost: proposal.score,
        })),
      ],
      filter: false,
    };

    if (result.options.length === 0 && !hasSameName && context.explicit) {
      result.options = [{
        apply: word.text,
        label: localizationService.translate('sql_editor_hint_empty'),
      }];
    }

    if (result.options.length === 0) {
      return null;
    }

    return result;
  }

  return useEditorAutocompletion({
    override: [completionSource],
    icons: false,
  });
}