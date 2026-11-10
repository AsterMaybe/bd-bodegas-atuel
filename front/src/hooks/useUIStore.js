import { create } from "zustand";

export const useSidebarStore = create((set) => ({
  collapsed: false,
  toggle: () => set((state) => ({ collapsed: !state.collapsed })),
  setCollapsed: (collapsed) => set({ collapsed }),
}));

export const useUIStore = create((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { id: Date.now(), ...toast }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  modals: {},
  openModal: (key, props) => set((state) => ({ modals: { ...state.modals, [key]: props } })),
  closeModal: (key) => set((state) => ({ modals: { ...state.modals, [key]: null } })),
}));
