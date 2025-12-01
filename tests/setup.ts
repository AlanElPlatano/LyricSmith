import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach as vitestAfterEach } from 'vitest';

vitestAfterEach(() => {
  cleanup();
});
