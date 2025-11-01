import { createContext, FunctionComponent, ReactNode, useContext } from 'react';

export default function createContextHook<T>(
  contextInitializer: () => T,
  defaultValue?: T,
): [Context: FunctionComponent<{ children: ReactNode }>, useHook: () => T] {
  const Context = createContext<T | undefined>(defaultValue);

  const Provider: FunctionComponent<{ children: ReactNode }> = ({ children }) => {
    return (
      <Context.Provider value={contextInitializer()}>
        {children}
      </Context.Provider>
    );
  };

  const useHook = () => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error('Hook must be used within its Provider');
    }
    return context;
  };

  return [Provider, useHook];
}
