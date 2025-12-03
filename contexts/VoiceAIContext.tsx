import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as Speech from 'expo-speech';

const STORAGE_KEYS = {
  API_KEY: "voice_ai_api_key",
  NOTES: "voice_ai_notes",
} as const;

export interface AINote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  type: "user" | "assistant";
}

interface VoiceAIState {
  apiKey: string;
  isApiKeySet: boolean;
  notes: AINote[];
  isListening: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  lastResponse: string;
}

const initialState: VoiceAIState = {
  apiKey: "",
  isApiKeySet: false,
  notes: [],
  isListening: false,
  isProcessing: false,
  currentTranscript: "",
  lastResponse: "",
};

export const [VoiceAIProvider, useVoiceAI] = createContextHook(() => {
  const [state, setState] = useState<VoiceAIState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedApiKey, storedNotes] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
        AsyncStorage.getItem(STORAGE_KEYS.NOTES),
      ]);

      setState(prev => ({
        ...prev,
        apiKey: storedApiKey || "",
        isApiKeySet: !!storedApiKey,
        notes: storedNotes ? JSON.parse(storedNotes) : [],
      }));
      setIsLoaded(true);
      console.log("VoiceAI: Data loaded successfully");
    } catch (error) {
      console.error("VoiceAI: Error loading stored data:", error);
      setIsLoaded(true);
    }
  };

  const setApiKey = useCallback(async (key: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
      setState(prev => ({
        ...prev,
        apiKey: key,
        isApiKeySet: !!key,
      }));
      console.log("VoiceAI: API key saved");
      return true;
    } catch (error) {
      console.error("VoiceAI: Error saving API key:", error);
      return false;
    }
  }, []);

  const clearApiKey = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.API_KEY);
      setState(prev => ({
        ...prev,
        apiKey: "",
        isApiKeySet: false,
      }));
      console.log("VoiceAI: API key cleared");
      return true;
    } catch (error) {
      console.error("VoiceAI: Error clearing API key:", error);
      return false;
    }
  }, []);

  const saveNote = useCallback(async (note: Omit<AINote, "id" | "createdAt">) => {
    try {
      const newNote: AINote = {
        ...note,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...state.notes];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
      setState(prev => ({
        ...prev,
        notes: updatedNotes,
      }));
      console.log("VoiceAI: Note saved:", newNote.id);
      return newNote;
    } catch (error) {
      console.error("VoiceAI: Error saving note:", error);
      return null;
    }
  }, [state.notes]);

  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const updatedNotes = state.notes.filter(n => n.id !== noteId);
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));
      setState(prev => ({
        ...prev,
        notes: updatedNotes,
      }));
      console.log("VoiceAI: Note deleted:", noteId);
      return true;
    } catch (error) {
      console.error("VoiceAI: Error deleting note:", error);
      return false;
    }
  }, [state.notes]);

  const clearAllNotes = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
      setState(prev => ({
        ...prev,
        notes: [],
      }));
      console.log("VoiceAI: All notes cleared");
      return true;
    } catch (error) {
      console.error("VoiceAI: Error clearing notes:", error);
      return false;
    }
  }, []);

  const setListening = useCallback((listening: boolean) => {
    setState(prev => ({
      ...prev,
      isListening: listening,
    }));
  }, []);

  const setProcessing = useCallback((processing: boolean) => {
    setState(prev => ({
      ...prev,
      isProcessing: processing,
    }));
  }, []);

  const setCurrentTranscript = useCallback((transcript: string) => {
    setState(prev => ({
      ...prev,
      currentTranscript: transcript,
    }));
  }, []);

  const setLastResponse = useCallback((response: string) => {
    setState(prev => ({
      ...prev,
      lastResponse: response,
    }));
  }, []);

  const speakResponse = useCallback(async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        await Speech.speak(text, {
          rate: 0.9,
          pitch: 1,
          language: 'en-US',
        });
      }
    } catch (error) {
      console.error("VoiceAI: Error speaking response:", error);
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } else {
        await Speech.stop();
      }
    } catch (error) {
      console.error("VoiceAI: Error stopping speech:", error);
    }
  }, []);

  const sendToAI = useCallback(async (
    message: string,
    context?: { screen?: string; data?: Record<string, unknown> }
  ): Promise<string> => {
    if (!state.apiKey) {
      return "Please set your OpenAI API key in Settings first.";
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setProcessing(true);

    try {
      const systemPrompt = `You are a helpful AI assistant for a truck driver companion app called TD Companion. 
You help truck drivers with:
- Managing their truck and trailer information
- Tracking places they've visited
- Managing files and documents
- Emergency contacts
- Health insurance information
- Driver ID information
- Safety tips and information

Be concise, friendly, and helpful. Keep responses brief and focused on the driver's needs.
${context?.screen ? `The user is currently on the ${context.screen} screen.` : ''}
${context?.data ? `Current context data: ${JSON.stringify(context.data)}` : ''}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("VoiceAI: API error:", errorData);
        
        if (response.status === 401) {
          return "Invalid API key. Please check your API key in Settings.";
        }
        if (response.status === 429) {
          return "Rate limit exceeded. Please try again in a moment.";
        }
        return "Sorry, I couldn't process your request. Please try again.";
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
      
      setLastResponse(aiResponse);
      console.log("VoiceAI: Response received");
      
      return aiResponse;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return "Request cancelled.";
      }
      console.error("VoiceAI: Error sending to AI:", error);
      return "Sorry, there was an error processing your request.";
    } finally {
      setProcessing(false);
    }
  }, [state.apiKey, setProcessing, setLastResponse]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProcessing(false);
    setListening(false);
  }, [setProcessing, setListening]);

  return {
    ...state,
    isLoaded,
    setApiKey,
    clearApiKey,
    saveNote,
    deleteNote,
    clearAllNotes,
    setListening,
    setProcessing,
    setCurrentTranscript,
    setLastResponse,
    sendToAI,
    speakResponse,
    stopSpeaking,
    cancelRequest,
  };
});
