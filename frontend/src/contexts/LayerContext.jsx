import React, { createContext, useContext, useState } from 'react';

const LayerContext = createContext();

export const useLayer = () => useContext(LayerContext);

export const LayerProvider = ({ children }) => {
  const [currentLayer, setCurrentLayer] = useState('globe');
  const [selectedCorridor, setSelectedCorridor] = useState(null); // { fromNode, toNode }
  const [selectedCsId, setSelectedCsId] = useState(null);

  const navigateToGlobe = () => {
    setCurrentLayer('globe');
    setSelectedCorridor(null);
    setSelectedCsId(null);
  };

  const navigateToNational = () => {
    setCurrentLayer('national');
    setSelectedCorridor(null);
    setSelectedCsId(null);
  };

  const navigateToCorridor = (fromNode, toNode) => {
    setSelectedCorridor({ fromNode, toNode });
    setCurrentLayer('corridor');
    setSelectedCsId(null);
  };

  const navigateToColdStore = (csId) => {
    setSelectedCsId(csId);
    setCurrentLayer('coldstore');
    setSelectedCorridor(null);
  };

  return (
    <LayerContext.Provider value={{
      currentLayer,
      selectedCorridor,
      selectedCsId,
      navigateToGlobe,
      navigateToNational,
      navigateToCorridor,
      navigateToColdStore
    }}>
      {children}
    </LayerContext.Provider>
  );
};
