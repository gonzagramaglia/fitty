import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { X, Send, Bot, AlertCircle, Pencil, Trash2 } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

/**
 * Represents a single message in the chat history.
 */
type Message = {
  /** The author of the message: 'user' or 'assistant'. */
  role: 'user' | 'assistant';
  /** The text content of the message. */
  content: string;
};

/**
 * Props for the ChatModal component.
 */
type Props = {
  /** Whether the modal is currently visible. */
  visible: boolean;
  /** Callback fired when the user closes the modal. */
  onClose: () => void;
  /** The unique identifier of the health check being discussed. */
  healthCheckId: string;
  /** Initial history of the chat. */
  initialHistory: Message[];
  /** Callback fired when the history is updated (new message, edit, delete). */
  onHistoryUpdate: (history: Message[]) => void;
};

/**
 * A modal component providing a chat interface to ask questions about a specific health check.
 * Handles optimistic updates, edit/delete actions, and interacts with the chat backend.
 * 
 * @param {Props} props - The component props.
 */
export function ChatModal({ visible, onClose, healthCheckId, initialHistory, onHistoryUpdate }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setMessages(initialHistory);
      setError(null);
    }
  }, [visible, initialHistory]);

  const sendMessage = async (overrideHistory?: Message[]) => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setError(null);

    const historyToUse = overrideHistory || messages;
    const newMessages: Message[] = [...historyToUse, { role: 'user', content: userMessage }];
    
    // Optimistic update
    setMessages(newMessages);
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_CHAT_API_URL || 'http://localhost:3001/api/chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthCheckId,
          message: userMessage,
          chatHistory: historyToUse
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages(data.chatHistory);
      onHistoryUpdate(data.chatHistory);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setMessages(historyToUse);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Persists a newly updated history array to the backend Supabase database.
   * Also updates local state and triggers the `onHistoryUpdate` callback.
   * 
   * @param {Message[]} newHistory - The updated array of chat messages.
   */
  const persistHistory = async (newHistory: Message[]) => {
    setMessages(newHistory);
    onHistoryUpdate(newHistory);
    try {
      await supabase
        .from('health_checks')
        .update({ chat_history: newHistory })
        .eq('id', healthCheckId);
    } catch (err) {
      console.error('Failed to sync history deletion', err);
    }
  };

  /**
   * Prompts the user to confirm deletion of a chat message.
   * If confirmed, deletes the user message and the immediate AI response (if it exists).
   * 
   * @param {number} index - The index of the message to delete.
   */
  const confirmDelete = (index: number) => {
    // Determine how many messages to delete. If it's a user message, we might also want to delete the assistant's direct reply.
    let endIndex = index + 1;
    if (endIndex < messages.length && messages[endIndex].role === 'assistant') {
      endIndex++;
    }
    
    const executeDelete = () => {
      const newHistory = [...messages.slice(0, index), ...messages.slice(endIndex)];
      persistHistory(newHistory);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Delete this message?")) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: executeDelete }
        ]
      );
    }
  };

  /**
   * Prompts the user to confirm editing a chat message.
   * Warns the user that all subsequent messages will be lost.
   * If confirmed, slices the chat history and populates the input field.
   * 
   * @param {number} index - The index of the user message to edit.
   */
  const confirmEdit = (index: number) => {
    const isLastUserMessage = index === messages.length - 2 || index === messages.length - 1;
    
    const executeEdit = () => {
      const messageToEdit = messages[index].content;
      const historyToKeep = messages.slice(0, index);
      setInputText(messageToEdit);
      persistHistory(historyToKeep); // We truncate the history in the DB immediately
    };

    if (isLastUserMessage) {
      executeEdit();
      return;
    }

    const warningText = "Editing this message will permanently overwrite all subsequent messages in this chat. Do you wish to continue?";

    if (Platform.OS === 'web') {
      if (window.confirm(warningText)) {
        executeEdit();
      }
    } else {
      Alert.alert(
        "Warning",
        warningText,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", style: "destructive", onPress: executeEdit }
        ]
      );
    }
  };

  if (!visible) return null;

  const content = (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-end bg-black/50"
    >
      <View className="bg-background w-full h-[80%] rounded-t-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-white">
          <View className="flex-row items-center">
            <Bot color="#1A303F" size={24} className="mr-2" />
            <Text className="text-text-primary text-lg font-bold">Ask Vet AI</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 bg-surface-secondary rounded-full">
            <X color="#64748B" size={20} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4 bg-surface" 
          contentContainerStyle={{ paddingBottom: 24 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View className="items-center justify-center py-4 px-4">
              <View className="w-16 h-16 rounded-full bg-primary-cool/10 items-center justify-center mb-2">
                <Bot color="#74B7B5" size={32} />
              </View>
              <Text className="text-text-primary font-bold text-base mb-2">Have questions?</Text>
              <Text className="text-text-muted text-center leading-relaxed">
                Ask me anything about this health check report! For example: "Why is the score 7?" or "How can I reduce calories?"
              </Text>
            </View>
          )}

          {messages.map((msg, idx) => (
            <View key={idx} className={`flex-row mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <View className="w-8 h-8 rounded-full bg-primary-cool/20 items-center justify-center mr-2 mt-1">
                  <Bot color="#74B7B5" size={16} />
                </View>
              )}
              
              {/* User Actions */}
              {msg.role === 'user' && !isLoading && (
                <View className="flex-row items-center mr-2 opacity-50">
                   <TouchableOpacity onPress={() => confirmEdit(idx)} className="p-2">
                     <Pencil size={14} color="#64748B" />
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => confirmDelete(idx)} className="p-2">
                     <Trash2 size={14} color="#EF4444" />
                   </TouchableOpacity>
                </View>
              )}

              <View 
                className={`max-w-[75%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary-cool rounded-tr-sm' 
                    : 'bg-white border border-border rounded-tl-sm shadow-sm'
                }`}
              >
                <Text className={msg.role === 'user' ? 'text-white' : 'text-text-primary'}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary-cool/20 items-center justify-center mr-2">
                <Bot color="#74B7B5" size={16} />
              </View>
              <View className="bg-white border border-border rounded-2xl rounded-tl-sm p-4 px-6 shadow-sm">
                <ActivityIndicator size="small" color="#74B7B5" />
              </View>
            </View>
          )}

          {error && (
            <View className="flex-row items-center bg-error/10 p-3 rounded-lg mt-2">
              <AlertCircle color="#EF4444" size={16} className="mr-2" />
              <Text className="text-error flex-1">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="p-4 border-t border-border bg-white flex-row items-center">
          <TextInput
            className="flex-1 bg-surface-secondary border border-border rounded-full px-4 py-3 mr-2 text-text-primary"
            placeholder="Type your question..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            editable={!isLoading}
          />
          <TouchableOpacity 
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            className={`w-12 h-12 rounded-full items-center justify-center ${!inputText.trim() || isLoading ? 'bg-border' : 'bg-primary-cool'}`}
          >
            <Send color="white" size={20} style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  if (Platform.OS === 'web') {
    return (
      <View className="absolute top-0 bottom-0 left-0 right-0 z-50">
        {content}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      {content}
    </Modal>
  );
}
