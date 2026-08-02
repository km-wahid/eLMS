import { create } from 'zustand';
import noteService from '../services/noteService';

export const useNoteStore = create((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,
  error: null,

  // Fetch all notes for user
  fetchNotes: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await noteService.getNotes(params);
      set({ notes: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch notes', loading: false });
      throw error;
    }
  },

  // Fetch note for a specific module
  fetchNoteByModule: async (moduleId) => {
    set({ loading: true, error: null });
    try {
      const response = await noteService.getNotesByModule(moduleId);
      set({ currentNote: response.data, loading: false });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        set({ currentNote: null, loading: false });
        return null;
      }
      set({ error: error.response?.data?.message || 'Failed to fetch note', loading: false });
      throw error;
    }
  },

  // Create a new note
  createNote: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await noteService.createNote(data);
      set((state) => ({
        notes: [...state.notes, response.data],
        currentNote: response.data,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create note', loading: false });
      throw error;
    }
  },

  // Update a note
  updateNote: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await noteService.updateNote(id, data);
      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? response.data : note)),
        currentNote: response.data,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update note', loading: false });
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (id) => {
    set({ loading: true, error: null });
    try {
      await noteService.deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        currentNote: null,
        loading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete note', loading: false });
      throw error;
    }
  },

  // Clear current note
  clearCurrentNote: () => set({ currentNote: null }),

  // Clear all notes
  clearNotes: () => set({ notes: [], currentNote: null, error: null }),
}));
