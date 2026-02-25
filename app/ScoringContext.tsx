"use client";
import { createContext, useContext, useState } from "react";

const DEFAULT_SCORING = {
  pts: 1.0, reb: 1.2, ast: 1.5, stl: 3.0, blk: 3.0, tov: -1.0,
  fgm: 0.0, fga: 0.0, tpm: 0.0, ftm: 0.0, fta: 0.0,
};

type Scoring = typeof DEFAULT_SCORING;
type ScoringContextType = { scoring: Scoring; setScoring: (s: Scoring) => void };

const ScoringContext = createContext<ScoringContextType>({
  scoring: DEFAULT_SCORING,
  setScoring: () => {},
});

export function ScoringProvider({ children }: { children: React.ReactNode }) {
  const [scoring, setScoring] = useState(DEFAULT_SCORING);
  return (
    <ScoringContext.Provider value={{ scoring, setScoring }}>
      {children}
    </ScoringContext.Provider>
  );
}

export function useScoring() {
  return useContext(ScoringContext);
}

export { DEFAULT_SCORING };