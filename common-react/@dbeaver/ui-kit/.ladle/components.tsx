import '../src/index.css';
import './global.css';
import icons from '../assets/icons/icons.svg?raw';

import type { GlobalProvider } from '@ladle/react';

export const Provider: GlobalProvider = ({ children }) => {
  return (
    <div>
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: icons }} />
      {children}
    </div>
  );
};
