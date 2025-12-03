import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, MessageSquare, Bot, User, Calendar } from "lucide-react-native";

import Colors from "@/constants/colors";
import standardShadow from "@/constants/shadows";
import PageHeader from "@/components/PageHeader";
import { Clickable } from "@/components/Clickable";
import { useVoiceAI, AINote } from "@/contexts/VoiceAIContext";

export default function AINotesScreen() {
  const insets = useSafeAreaInsets();
  const { notes, deleteNote, clearAllNotes } = useVoiceAI();
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNote(noteId),
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (notes.length === 0) {
      Alert.alert("No Notes", "There are no notes to delete.");
      return;
    }
    Alert.alert(
      "Clear All Notes",
      "Are you sure you want to delete all AI notes? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => clearAllNotes(),
        },
      ]
    );
  };

  const toggleExpand = (noteId: string) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="AI Notes"
        subtitle="Saved conversations with AI"
        topInset={insets.top + 16}
        rightAccessory={
          notes.length > 0 ? (
            <Clickable style={styles.clearAllButton} onPress={handleClearAll}>
              <Trash2 color={Colors.error} size={18} />
            </Clickable>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageSquare color={Colors.textLight} size={48} />
            </View>
            <Text style={styles.emptyTitle}>No AI Notes Yet</Text>
            <Text style={styles.emptyDescription}>
              Your saved conversations with the AI assistant will appear here. Use the microphone button to start a conversation and save notes.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.noteCount}>
              {notes.length} {notes.length === 1 ? "note" : "notes"} saved
            </Text>
            {notes.map((note: AINote) => (
              <NoteCard
                key={note.id}
                note={note}
                isExpanded={expandedNote === note.id}
                onToggle={() => toggleExpand(note.id)}
                onDelete={() => handleDeleteNote(note.id)}
                formatDate={formatDate}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

interface NoteCardProps {
  note: AINote;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

function NoteCard({ note, isExpanded, onToggle, onDelete, formatDate }: NoteCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const isUser = note.type === "user";

  return (
    <Animated.View style={[styles.noteCard, { transform: [{ scale: scaleAnim }] }]}>
      <Clickable
        style={styles.noteCardTouchable}
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTypeContainer}>
            <View style={[styles.noteTypeIcon, isUser ? styles.noteTypeUser : styles.noteTypeAI]}>
              {isUser ? (
                <User color={Colors.white} size={16} />
              ) : (
                <Bot color={Colors.white} size={16} />
              )}
            </View>
            <Text style={styles.noteTypeLabel}>
              {isUser ? "You" : "AI Assistant"}
            </Text>
          </View>
          <Clickable
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 color={Colors.error} size={18} />
          </Clickable>
        </View>

        <Text style={styles.noteTitle} numberOfLines={isExpanded ? undefined : 1}>
          {note.title}
        </Text>

        <Text
          style={styles.noteContent}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {note.content}
        </Text>

        <View style={styles.noteDateContainer}>
          <Calendar color={Colors.textLight} size={14} />
          <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
        </View>

        {!isExpanded && note.content.length > 150 && (
          <Text style={styles.readMore}>Tap to read more...</Text>
        )}
      </Clickable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  clearAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.error}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.textLight}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  noteCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: "500" as const,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    ...standardShadow,
    overflow: "hidden",
  },
  noteCardTouchable: {
    padding: 16,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  noteTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  noteTypeUser: {
    backgroundColor: Colors.primaryLight,
  },
  noteTypeAI: {
    backgroundColor: Colors.secondary,
  },
  noteTypeLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
  },
  deleteButton: {
    padding: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000000",
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  noteDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  readMore: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: "600" as const,
    marginTop: 8,
  },
});
