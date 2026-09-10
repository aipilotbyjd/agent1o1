import { create } from 'zustand';

type TGlobalSearchState = {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
};

export const useGlobalSearchStore = create<TGlobalSearchState>((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
	toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
