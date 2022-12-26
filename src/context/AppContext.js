import React, { createContext, useContext, useReducer } from "react";

export const AppContext = createContext();

export const AppContextProvider = ({ initialState, reducer, children }) => {
  return (
    <AppContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContextValue = () => useContext(AppContext);
