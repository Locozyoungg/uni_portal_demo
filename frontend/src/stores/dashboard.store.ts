import { create } from 'zustand';

interface DashboardStats {
  currentSemester: string;
  registeredUnits: number;
  outstandingFees: number;
  gpa: number;
  cgpa: number;
  activeElections: number;
  borrowedBooks: number;
  hostelStatus: string;
  unreadNotifications: number;
  upcomingEvents: number;
}

interface DashboardStore {
  stats: DashboardStats | null;
  isLoading: boolean;
  setStats: (stats: DashboardStats) => void;
  setLoading: (loading: boolean) => void;
  clearStats: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  setStats: (stats) => set({ stats, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clearStats: () => set({ stats: null, isLoading: false }),
}));
