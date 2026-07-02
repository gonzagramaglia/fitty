import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [isGuest, setIsGuest] = useState(false);
  const [mockStep, setMockStep] = useState(0);
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    destructiveLabel: string;
    onConfirm: () => void;
  }>({ visible: false, title: '', message: '', destructiveLabel: '', onConfirm: () => {} });

  const MOCK_SCRIPT = [
    { 
      q: "How can I reduce his calorie intake safely?", 
      a: "To reduce calories safely, avoid sudden drops. Measure his dry food precisely, substitute some dry kibble with low-calorie wet food (which has more moisture and fills him up), and cut out extra treats." 
    },
    { 
      q: "Can I give him human food as a treat instead?", 
      a: "It's best to avoid most human food as it can disrupt his balanced diet and add hidden calories. If you must, a small piece of plain, unseasoned boiled chicken is a safe, low-calorie option." 
    },
    {
      q: "How much play time does he need?",
      a: "Aim for at least two 15-minute active play sessions per day. Use feather wands or laser pointers to get him running and jumping to burn off those extra calories!"
    }
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.is_anonymous) {
        setIsGuest(true);
      }
    });
  }, []);

  useEffect(() => {
    if (visible) {
      setMessages(initialHistory);
      setError(null);
      if (isGuest) {
        const aiCount = initialHistory.filter(m => m.role === 'assistant').length;
        setMockStep(aiCount);
      }
    }
  }, [visible, initialHistory, isGuest]);

  const handleMockInputTap = () => {
    if (mockStep >= MOCK_SCRIPT.length || isAutoTyping || isLoading) return;
    
    setIsAutoTyping(true);
    const question = MOCK_SCRIPT[mockStep].q;
    let currentText = "";
    let i = 0;
    setInputText("");
    
    const interval = setInterval(() => {
      if (i < question.length) {
        currentText += question[i];
        setInputText(currentText);
        i++;
      } else {
        clearInterval(interval);
        setIsAutoTyping(false);
      }
    }, 30);
  };

  const sendMessage = async (overrideHistory?: Message[]) => {
    if (!inputText.trim() || isLoading) return;

    if (isGuest) {
      const userMessage = inputText.trim();
      setInputText('');
      const historyToUse = overrideHistory || messages;
      const newMessages: Message[] = [...historyToUse, { role: 'user', content: userMessage }];
      
      setMessages(newMessages);
      setIsLoading(true);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      await new Promise(r => setTimeout(r, 2000)); // Simulate thinking

      const answer = MOCK_SCRIPT[mockStep]?.a || "I'm just a simulation! You've reached the end of my script.";
      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: answer }];
      
      setMessages(finalMessages);
      onHistoryUpdate(finalMessages);
      setMockStep(prev => prev + 1);
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          healthCheckId,
          message: userMessage,
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
    let endIndex = index + 1;
    if (endIndex < messages.length && messages[endIndex].role === 'assistant') {
      endIndex++;
    }
    
    const executeDelete = () => {
      const newHistory = [...messages.slice(0, index), ...messages.slice(endIndex)];
      persistHistory(newHistory);
    };

    setConfirmModal({
      visible: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      destructiveLabel: 'Delete',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        executeDelete();
      },
    });
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
      persistHistory(historyToKeep);
    };

    if (isLastUserMessage) {
      executeEdit();
      return;
    }

    setConfirmModal({
      visible: true,
      title: 'Edit Message',
      message: 'Editing this message will permanently overwrite all subsequent messages in this chat. Do you wish to continue?',
      destructiveLabel: 'Continue',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        executeEdit();
      },
    });
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
              <Text className="text-text-muted text-center leading-relaxed mb-6">
                Ask me anything about this health check report! For example: "Why is the score 7?" or "How can I reduce calories?"
              </Text>

              {isGuest && (
                <View className="bg-blue-50/80 px-4 py-3 rounded-xl border border-blue-200 flex-row items-center w-full">
                  <AlertCircle color="#3B82F6" size={20} style={{ marginRight: 12, marginTop: 2 }} className="self-start" />
                  <Text className="text-blue-800 text-sm flex-1 leading-relaxed text-left">
                    <Text className="font-bold">Judge Mode Simulation:</Text> This chat is simulated. For the real AI experience, please log in with a Google account.
                  </Text>
                </View>
              )}
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
          {isGuest ? (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleMockInputTap}
              disabled={isAutoTyping || isLoading || mockStep >= MOCK_SCRIPT.length}
              className="flex-1 bg-surface-secondary border border-border rounded-full px-4 py-3 mr-2"
            >
              <Text className={inputText ? "text-text-primary" : "text-[#94A3B8]"}>
                {inputText || (mockStep >= MOCK_SCRIPT.length ? "Simulation complete." : "Judge, tap to simulate question...")}
              </Text>
            </TouchableOpacity>
          ) : (
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
          )}
          <TouchableOpacity 
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading || isAutoTyping}
            className={`w-12 h-12 rounded-full items-center justify-center ${!inputText.trim() || isLoading || isAutoTyping ? 'bg-border' : 'bg-primary-cool'}`}
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
    <>
    <Modal visible={visible} animationType="slide" transparent={true}>
      {content}
    </Modal>

    {/* Confirmation Modal */}
    <Modal visible={confirmModal.visible} animationType="fade" transparent={true}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <TouchableOpacity activeOpacity={1} className="bg-surface w-full max-w-[320px] rounded-2xl p-6 shadow-xl">
          <Text className="text-text-primary text-lg font-bold mb-2">{confirmModal.title}</Text>
          <Text className="text-text-secondary text-sm mb-6">{confirmModal.message}</Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
              className="px-4 py-2.5 rounded-xl border border-border"
            >
              <Text className="text-text-primary font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmModal.onConfirm}
              className="px-4 py-2.5 rounded-xl bg-error"
            >
              <Text className="text-white font-semibold text-sm">{confirmModal.destructiveLabel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    </>
  );
}
