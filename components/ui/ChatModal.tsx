import { useState, useEffect, useRef } from 'react';
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
  /** The owner's first name for personalization. */
  ownerName?: string;
  /** The cat's name for personalization. */
  catName?: string;
  /** Whether the health check is currently being processed. */
  isProcessing?: boolean;
  /** Whether the health check analysis failed. */
  isFailed?: boolean;
};

/**
 * A modal component providing a chat interface to ask questions about a specific health check.
 * Handles optimistic updates, edit/delete actions, and interacts with the chat backend.
 * 
 * @param {Props} props - The component props.
 */
export function ChatModal({ visible, onClose, healthCheckId, initialHistory, onHistoryUpdate, ownerName, isProcessing, isFailed, catName }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [mockStep, setMockStep] = useState(0);
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingOriginalText, setEditingOriginalText] = useState<string>('');
  const [hasEdited, setHasEdited] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const mockTypingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Track if initialHistory reference changed due to external load (not our own updates)
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (visible) {
      // Only reset editing state on external history loads, not our own updates
      if (!isInternalUpdate.current) {
        setMessages(initialHistory);
        setError(null);
        setEditingIndex(null);
        setHasEdited(false);
        if (isGuest) {
          const aiCount = initialHistory.filter(m => m.role === 'assistant').length;
          setMockStep(aiCount);
        }
      }
      isInternalUpdate.current = false;
    } else {
      // Clean up typing intervals when modal closes
      if (mockTypingRef.current) {
        clearInterval(mockTypingRef.current);
        mockTypingRef.current = null;
      }
      if (typingRef.current) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }
      setIsAutoTyping(false);
      setTypingMessage(null);
      setInputText('');
      setEditingIndex(null);
      setEditingOriginalText('');
    }
  }, [visible, initialHistory, isGuest]);

  const handleMockInputTap = () => {
    if (mockStep >= MOCK_SCRIPT.length || isAutoTyping || isLoading) return;
    
    // Clear any existing typing interval
    if (mockTypingRef.current) {
      clearInterval(mockTypingRef.current);
      mockTypingRef.current = null;
    }

    setIsAutoTyping(true);
    const question = MOCK_SCRIPT[mockStep].q;
    let currentText = "";
    let i = 0;
    setInputText("");
    
    mockTypingRef.current = setInterval(() => {
      if (i < question.length) {
        currentText += question[i];
        setInputText(currentText);
        i++;
      } else {
        if (mockTypingRef.current) {
          clearInterval(mockTypingRef.current);
          mockTypingRef.current = null;
        }
        setIsAutoTyping(false);
      }
    }, 30);
  };

  const sendMessage = async (overrideHistory?: Message[]) => {
    if (!inputText.trim() || isLoading) return;
    if (inputText.length > 500) {
      setError('Message must be under 500 characters.');
      return;
    }

    // If we're editing, slice history to before the edited message
    let baseHistory = overrideHistory || messages;
    let isEditAction = false;
    if (editingIndex !== null) {
      baseHistory = messages.slice(0, editingIndex);
      isEditAction = true;
      setEditingIndex(null);
      setHasEdited(true);
    }

    if (isGuest) {
      const userMessage = inputText.trim();
      setInputText('');
      const newMessages: Message[] = [...baseHistory, { role: 'user', content: userMessage }];
      
      setMessages(newMessages);
      setIsLoading(true);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

      await new Promise(r => setTimeout(r, 2000)); // Simulate thinking

      // If this was an edit, use a generic response and advance past the edited script item
      let answer: string;
      if (isEditAction) {
        answer = "Great question! Based on the health check results, I'd recommend discussing this specific concern with your vet for personalized advice tailored to your cat's needs.";
        // Advance mockStep past the one that was edited so next tap gives a new question
        setMockStep(prev => Math.min(prev + 1, MOCK_SCRIPT.length));
      } else {
        answer = MOCK_SCRIPT[mockStep]?.a || "I'm just a simulation! You've reached the end of my script.";
        setMockStep(prev => prev + 1);
      }

      const finalMessages: Message[] = [...newMessages, { role: 'assistant', content: answer }];
      
      setMessages(finalMessages);
      isInternalUpdate.current = true;
      onHistoryUpdate(finalMessages);

      // Persist to Supabase so chat history survives page refresh
      try {
        const { error: persistError } = await supabase
          .from('health_checks')
          .update({ chat_history: finalMessages })
          .eq('id', healthCheckId);
        if (persistError) console.error('Failed to persist guest chat history', persistError);
      } catch (err) {
        console.error('Failed to persist guest chat history', err);
      }

      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    setError(null);

    const newMessages: Message[] = [...baseHistory, { role: 'user', content: userMessage }];
    
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

      // Typewriter effect for the AI response
      const fullHistory: Message[] = data.chatHistory;
      const lastMsg = fullHistory[fullHistory.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        const withoutLast = fullHistory.slice(0, -1);
        setMessages([...withoutLast, { role: 'assistant', content: '' }]);
        setIsLoading(false);
        
        const fullText = lastMsg.content;
        let i = 0;
        typingRef.current = setInterval(() => {
          i += 2; // 2 chars at a time for speed
          if (i >= fullText.length) {
            if (typingRef.current) clearInterval(typingRef.current);
            typingRef.current = null;
            setMessages(fullHistory);
            setTypingMessage(null);
            isInternalUpdate.current = true;
            onHistoryUpdate(fullHistory);
          } else {
            setMessages([...withoutLast, { role: 'assistant', content: fullText.substring(0, i) }]);
            setTypingMessage(fullText.substring(0, i));
          }
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 15);
      } else {
        setMessages(fullHistory);
        isInternalUpdate.current = true;
        onHistoryUpdate(fullHistory);
        setIsLoading(false);
      }
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      setMessages(baseHistory);
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
    const previousHistory = messages;
    setMessages(newHistory);
    isInternalUpdate.current = true;
    onHistoryUpdate(newHistory);
    try {
      const { error: updateError } = await supabase
        .from('health_checks')
        .update({ chat_history: newHistory })
        .eq('id', healthCheckId);
      if (updateError) throw updateError;
    } catch (err) {
      console.error('Failed to sync chat history', err);
      setMessages(previousHistory);
      isInternalUpdate.current = true;
      onHistoryUpdate(previousHistory);
      setError('Failed to sync chat history. Please try again.');
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
      message: 'Are you sure you want to\ndelete this message?',
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
   * If confirmed, populates the input field but keeps the chat visible with an "editing" indicator.
   * 
   * @param {number} index - The index of the user message to edit.
   */
  const confirmEdit = (index: number) => {
    if (hasEdited) return; // Only one edit allowed per chat session

    const isLastUserMessage = index === messages.length - 2 || index === messages.length - 1;
    
    const executeEdit = () => {
      const messageToEdit = messages[index].content;
      setInputText(messageToEdit);
      setEditingIndex(index);
      setEditingOriginalText(messageToEdit);
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
            <View className="items-center justify-center py-0 px-4">
              <View className="w-16 h-16 rounded-full bg-primary-cool/10 items-center justify-center">
                <Bot color="#74B7B5" size={32} />
              </View>
              <Text className="text-text-primary font-bold text-base mb-2 text-center">
                {isFailed ? `Hey ${ownerName || 'there'}, the analysis didn't go through this time 😿` : isProcessing ? `Hi ${ownerName || 'there'}! How is ${catName || 'your cat'}? 😸` : `Have questions, ${ownerName || 'there'}?`}
              </Text>
              <Text className="text-text-muted text-center leading-relaxed mb-6">
                {isFailed
                  ? "You can retry the analysis from the report screen. In the meantime, feel free to ask general questions about cat health, nutrition, or BCS scores!"
                  : isProcessing 
                  ? "This health check is still being processed, but feel free to ask general questions about cat health, nutrition, or BCS scores!"
                  : 'Ask me anything about this health check report! For example: "Why is the score 7?" or "How can I reduce calories?"'}
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
              {msg.role === 'user' && !isLoading && editingIndex === null && (
                <View className="flex-row items-center mr-2 opacity-50">
                   {!hasEdited && (
                     <TouchableOpacity onPress={() => confirmEdit(idx)} className="p-2">
                       <Pencil size={14} color="#64748B" />
                     </TouchableOpacity>
                   )}
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
                } ${editingIndex === idx ? 'opacity-60' : ''}`}
              >
                <Text className={msg.role === 'user' ? 'text-white' : 'text-text-primary'}>
                  {msg.content}
                </Text>
                {editingIndex === idx && (
                  <Text className="text-white/70 text-xs mt-1.5 italic">✏️ Editing...</Text>
                )}
              </View>
            </View>
          ))}

          {isLoading && (
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-full bg-primary-cool/20 items-center justify-center mr-2">
                <Bot color="#74B7B5" size={16} />
              </View>
              <View className="bg-white border border-border rounded-2xl rounded-tl-sm p-4 px-5 shadow-sm flex-row items-center">
                <ActivityIndicator size="small" color="#74B7B5" />
                <Text className="text-text-muted text-sm ml-3">Thinking...</Text>
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
              maxLength={500}
            />
          )}
          <TouchableOpacity 
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading || isAutoTyping || (editingIndex !== null && inputText.trim() === editingOriginalText.trim())}
            className={`w-12 h-12 rounded-full items-center justify-center ${!inputText.trim() || isLoading || isAutoTyping || (editingIndex !== null && inputText.trim() === editingOriginalText.trim()) ? 'bg-border' : 'bg-primary-cool'}`}
          >
            <Send color="white" size={20} style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Confirmation Overlay */}
      {confirmModal.visible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 100, paddingHorizontal: 24 }}
        >
          <TouchableOpacity activeOpacity={1} className="bg-surface w-full max-w-[320px] rounded-2xl p-6 shadow-xl items-center">
            <Text className="text-text-primary text-lg font-bold mb-2 text-center">{confirmModal.title}</Text>
            <Text className="text-text-secondary text-sm mb-6 text-center">{confirmModal.message}</Text>
            <View className="flex-row justify-center gap-3">
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
      )}
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
    </>
  );
}
