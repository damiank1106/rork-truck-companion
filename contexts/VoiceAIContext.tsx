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

export interface AICommand {
  action: string;
  params: Record<string, unknown>;
  description: string;
}

export interface AIResponse {
  message: string;
  command?: AICommand;
}

interface VoiceAIState {
  apiKey: string;
  isApiKeySet: boolean;
  notes: AINote[];
  isListening: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  lastResponse: string;
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[];
}

const initialState: VoiceAIState = {
  apiKey: "",
  isApiKeySet: false,
  notes: [],
  isListening: false,
  isProcessing: false,
  currentTranscript: "",
  lastResponse: "",
  conversationHistory: [],
};

const APP_SYSTEM_PROMPT = `You are an AI assistant for TD Companion, a truck driver companion app. You help truck drivers manage their trucking operations efficiently.

## YOUR CAPABILITIES - You can execute these commands by responding with JSON:

### Navigation Commands:
- Navigate to screens: home, truck, trailer, places, files, settings, health-insurance, driver-id, safety-information, donations, ai-notes, emergency-contacts

### Truck Operations:
- Update truck number
- View truck information

### Trailer Operations:  
- Update trailer number
- View trailer information

### Files & Documents:
- Create new file/document
- View files list
- Open camera to scan document

### Places:
- View saved places
- Navigate to add new place

### Emergency Contacts:
- View emergency contacts
- Add new contact

### App Information:
- Answer questions about trucking, safety tips, DOT regulations
- Provide app feature guidance
- Help with truck/trailer specifications

## RESPONSE FORMAT:
When you need to execute an action, respond with JSON in this exact format:
\`\`\`json
{
  "message": "Your spoken response to the user",
  "command": {
    "action": "action_name",
    "params": { "key": "value" }
  }
}
\`\`\`

Available actions:
- "navigate": params: { "screen": "screen_name" }
- "update_truck_number": params: { "number": "string" }
- "update_trailer_number": params: { "number": "string" }
- "open_camera": params: {}
- "create_file": params: {}
- "show_truck_info": params: {}
- "show_trailer_info": params: {}
- "none": for questions/info only (no navigation needed)

## IMPORTANT RULES:
1. Be concise - drivers are busy and may be on breaks
2. Always confirm before making changes
3. For safety: remind users to only use the app when parked
4. If unclear what user wants, ask clarifying questions
5. Provide helpful trucking tips when relevant
6. Keep responses brief but friendly

## EXAMPLES:

User: "Change my truck number to 5432"
Response:
\`\`\`json
{
  "message": "I'll update your truck number to 5432.",
  "command": {
    "action": "update_truck_number",
    "params": { "number": "5432" }
  }
}
\`\`\`

User: "Open my files"
Response:
\`\`\`json
{
  "message": "Opening your files.",
  "command": {
    "action": "navigate",
    "params": { "screen": "files" }
  }
}
\`\`\`

User: "What's my truck information?"
Response:
\`\`\`json
{
  "message": "Let me show you your truck information.",
  "command": {
    "action": "navigate",
    "params": { "screen": "truck" }
  }
}
\`\`\`

User: "Take me to settings"
Response:
\`\`\`json
{
  "message": "Opening settings.",
  "command": {
    "action": "navigate",
    "params": { "screen": "settings" }
  }
}
\`\`\`

User: "I want to scan a document"
Response:
\`\`\`json
{
  "message": "Opening the camera to scan your document.",
  "command": {
    "action": "open_camera",
    "params": {}
  }
}
\`\`\`

User: "What's the maximum weight for a standard 53 foot trailer?"
Response:
\`\`\`json
{
  "message": "A standard 53-foot dry van trailer typically has a maximum legal gross weight of 80,000 lbs in most US states. The trailer itself weighs about 13,000-15,000 lbs, leaving around 43,000-45,000 lbs for cargo. Always check state-specific regulations as they can vary.",
  "command": {
    "action": "none",
    "params": {}
  }
}
\`\`\``;

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
        conversationHistory: [],
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

  const addToConversation = useCallback((role: "user" | "assistant", content: string) => {
    setState(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory.slice(-10),
        { role, content }
      ],
    }));
  }, []);

  const clearConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversationHistory: [],
    }));
  }, []);

  const speakResponse = useCallback(async (text: string) => {
    try {
      if (Platform.OS === 'web') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        await Speech.stop();
        await Speech.speak(text, {
          rate: 0.95,
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

  const parseAIResponse = useCallback((responseText: string): AIResponse => {
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          message: parsed.message || responseText,
          command: parsed.command,
        };
      }
      
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.message) {
          return {
            message: parsed.message,
            command: parsed.command,
          };
        }
      } catch {
        // not JSON
      }
      
      return { message: responseText };
    } catch {
      console.log("VoiceAI: Could not parse as JSON, returning as plain text");
      return { message: responseText };
    }
  }, []);

  const sendToAI = useCallback(async (
    message: string,
    context?: { 
      screen?: string; 
      truckData?: Record<string, unknown>;
      trailerData?: Record<string, unknown>;
      placesCount?: number;
      filesCount?: number;
      contactsCount?: number;
    }
  ): Promise<AIResponse> => {
    if (!state.apiKey) {
      return { message: "Please set your OpenAI API key in Settings first." };
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setProcessing(true);
    addToConversation("user", message);

    try {
      let contextInfo = "";
      if (context) {
        const parts = [];
        if (context.screen) parts.push(`Current screen: ${context.screen}`);
        if (context.truckData) {
          const truck = context.truckData;
          parts.push(`Truck info: Number: ${truck.truckNumber || 'Not set'}, Make: ${truck.make || 'Not set'}, Model: ${truck.model || 'Not set'}`);
        }
        if (context.trailerData) {
          const trailer = context.trailerData;
          parts.push(`Trailer info: Number: ${trailer.trailerNumber || 'Not set'}`);
        }
        if (context.placesCount !== undefined) parts.push(`Saved places: ${context.placesCount}`);
        if (context.filesCount !== undefined) parts.push(`Saved files: ${context.filesCount}`);
        if (context.contactsCount !== undefined) parts.push(`Emergency contacts: ${context.contactsCount}`);
        contextInfo = parts.join(". ");
      }

      const messages = [
        { role: "system" as const, content: APP_SYSTEM_PROMPT },
        ...state.conversationHistory.slice(-6),
        { 
          role: "user" as const, 
          content: contextInfo 
            ? `[Context: ${contextInfo}]\n\nUser request: ${message}`
            : message 
        },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 600,
          temperature: 0.7,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("VoiceAI: API error:", errorData);
        
        if (response.status === 401) {
          return { message: "Invalid API key. Please check your API key in Settings." };
        }
        if (response.status === 429) {
          return { message: "Rate limit exceeded. Please try again in a moment." };
        }
        return { message: "Sorry, I couldn't process your request. Please try again." };
      }

      const data = await response.json();
      const rawResponse = data.choices?.[0]?.message?.content || "I couldn't generate a response.";
      
      const parsedResponse = parseAIResponse(rawResponse);
      
      addToConversation("assistant", parsedResponse.message);
      setLastResponse(parsedResponse.message);
      console.log("VoiceAI: Response received", parsedResponse);
      
      return parsedResponse;
    } catch (caughtError: unknown) {
      if (caughtError instanceof Error && caughtError.name === 'AbortError') {
        return { message: "Request cancelled." };
      }
      console.error("VoiceAI: Error sending to AI:", caughtError);
      return { message: "Sorry, there was an error processing your request." };
    } finally {
      setProcessing(false);
    }
  }, [state.apiKey, state.conversationHistory, setProcessing, setLastResponse, addToConversation, parseAIResponse]);

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
    addToConversation,
    clearConversation,
  };
});
