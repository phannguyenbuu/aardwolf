import { createContext } from 'react';

// Keep provider and consumers on the same instance during Vite hot updates.
export const ConfiguratorContext = import.meta.hot?.data.context || createContext(null);
if (import.meta.hot) import.meta.hot.data.context = ConfiguratorContext;
