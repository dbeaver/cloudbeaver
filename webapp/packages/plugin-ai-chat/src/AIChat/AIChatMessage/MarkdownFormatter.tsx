/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Link, Loader } from '@cloudbeaver/core-blocks';

import { CodeFormatter } from './CodeFormatter.js';

interface Props {
  content: string;
  conversationId: string;
}

export const MarkdownFormatter = observer<Props>(function MarkdownFormatter({ content, conversationId }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => <Link target="_blank" rel="noopener noreferrer" indicator inline {...props} />,
        h1: ({ node, ...props }) => <h1 className="tw:text-xl! tw:font-semibold" {...props} />,
        h2: ({ node, ...props }) => <h2 className="tw:text-lg! tw:font-semibold" {...props} />,
        h3: ({ node, ...props }) => <h3 className="tw:text-lg! tw:font-semibold" {...props} />,
        h4: ({ node, ...props }) => <h4 className="tw:text-base! tw:font-semibold" {...props} />,
        h5: ({ node, ...props }) => <h5 className="tw:text-sm! tw:font-semibold" {...props} />,
        h6: ({ node, ...props }) => <h6 className="tw:text-xs! tw:font-semibold" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="tw:border-l-4 tw:text-(--theme-text-hint-on-light) tw:border-[var(--theme-secondary)] tw:pl-4" {...props} />
        ),
        ul: ({ node, ...props }) => <ul className="tw:list-disc tw:list-outside tw:flex tw:flex-col tw:gap-2" {...props} />,
        ol: ({ node, ...props }) => <ol className="tw:list-decimal tw:list-outside tw:flex tw:flex-col tw:gap-2" {...props} />,
        table: ({ node, ...props }) => <table className="tw:border-collapse tw:border tw:border-[var(--theme-background)]" {...props} />,
        th: ({ node, ...props }) => (
          <th className="tw:border tw:border-[var(--theme-background)] tw:px-2 tw:py-1 tw:bg-[var(--theme-secondary)]" {...props} />
        ),
        tr: ({ node, ...props }) => <tr className="tw:border-b tw:border-[var(--theme-background)]" {...props} />,
        td: ({ node, ...props }) => <td className="tw:border tw:border-[var(--theme-background)] tw:px-2 tw:py-1" {...props} />,
        code: ({ node, ...props }) => {
          const match = /language-(\w+)/.exec(props.className ?? '');
          const language = match ? match[1] : undefined;

          if (language) {
            return (
              <Loader suspense inline>
                <CodeFormatter className="tw:mb-2 tw:mt-2" language={language} code={String(props.children)} conversationId={conversationId} />
              </Loader>
            );
          }

          return <code className="tw:whitespace-pre-wrap tw:bg-[var(--theme-secondary)] tw:rounded tw:px-1 tw:py-0.5 tw:text-sm" {...props} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});
