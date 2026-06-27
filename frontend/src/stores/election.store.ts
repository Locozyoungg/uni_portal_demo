import { create } from 'zustand';

type IntegrationMode = 'mock' | 'iframe' | 'sdk';

interface IntegrationLog {
  id: string;
  event: string;
  status: string;
  createdAt: string;
}

interface ElectionStore {
  integrationMode: IntegrationMode;
  votingToken: string | null;
  logs: IntegrationLog[];
  isExchanging: boolean;
  exchangeError: string | null;
  setIntegrationMode: (mode: IntegrationMode) => void;
  setVotingToken: (token: string | null) => void;
  addLog: (log: IntegrationLog) => void;
  clearLogs: () => void;
  setIsExchanging: (value: boolean) => void;
  setExchangeError: (error: string | null) => void;
}

export const useElectionStore = create<ElectionStore>((set) => ({
  integrationMode: 'mock',
  votingToken: null,
  logs: [],
  isExchanging: false,
  exchangeError: null,
  setIntegrationMode: (mode) => set({ integrationMode: mode }),
  setVotingToken: (token) => set({ votingToken: token }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setIsExchanging: (isExchanging) => set({ isExchanging }),
  setExchangeError: (exchangeError) => set({ exchangeError }),
}));
