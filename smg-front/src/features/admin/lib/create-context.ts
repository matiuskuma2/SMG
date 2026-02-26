import { type Context, createContext as reactCreateContext, useContext } from "react";

export const createContext = <T>(defaultValue: T): [Context<T>, () => T] => {
  const context = reactCreateContext<T>(defaultValue);
  return [context, () => useContext(context)];
};
