import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  ScrollView, 
  Platform, 
  KeyboardAvoidingView,
  useWindowDimensions,
  Linking
} from 'react-native';
import { X, Send, Bot, User } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const JudgeChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Automatically open the chat after 1.5 seconds only on large screens, then show typing for 1 second
    const openTimer = setTimeout(() => {
      if (width > 768) {
        setIsOpen(true);
      }
      setIsLoading(true);
      
      setTimeout(() => {
        setMessages([
          { role: 'assistant', content: `Hi! I am the Fitty AI Assistant. Are you a judge? Ask me anything about our architecture, features, or stack!${width > 768 ? (pathname === '/presentation' ? '\n\nPro tip: You can launch the Fitty App by clicking here.' : '\n\nPro tip: You can view our Pitch Presentation by clicking here.') : ''}` }
        ]);
        setIsLoading(false);
      }, 1000);
    }, 1500);
    
    return () => clearTimeout(openTimer);
  }, [width]);

  useEffect(() => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[0].role === 'assistant' && newMessages[0].content.includes('Hi! I am the Fitty AI Assistant')) {
        newMessages[0] = { 
          ...newMessages[0], 
          content: `Hi! I am the Fitty AI Assistant. Are you a judge? Ask me anything about our architecture, features, or stack!${width > 768 ? (pathname === '/presentation' ? '\n\nPro tip: You can launch the Fitty App by clicking here.' : '\n\nPro tip: You can view our Pitch Presentation by clicking here.') : ''}`
        };
        return newMessages;
      }
      return prev;
    });
  }, [pathname, width]);

  useEffect(() => {
    if (isOpen) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, slideAnim]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Force at least a 1-second delay for the typing animation effect
      const [response] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: userMessage }],
          }),
        }),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error connecting to the server. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (Platform.OS !== 'web') {
    return null; // Only render on web for the hackathon demo
  }

  return (
    <View style={{
      position: 'absolute',
      bottom: 32,
      right: 32,
      zIndex: 100000, // Ensure it's above WebFrame
      alignItems: 'flex-end',
      pointerEvents: 'box-none'
    }}>
      {/* Chat Window */}
      {isOpen && (
        <Animated.View
          style={{
            width: 350,
            height: 500,
            backgroundColor: '#ffffff',
            borderRadius: 24,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#e2e8f0',
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          {/* Header */}
          <View style={{
            padding: 16,
            backgroundColor: '#FFD700', // Using Fitty's primary brand color
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: '#f1c40f',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Bot color="#1A2530" size={24} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A2530' }}>Judge AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={{ padding: 4 }}>
              <X color="#1A2530" size={24} />
            </TouchableOpacity>
          </View>

          {/* Messages Area */}
          <ScrollView 
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1, backgroundColor: '#f8fafc' }}
            contentContainerStyle={{ padding: 16, gap: 16 }}
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {msg.role === 'assistant' && (
                  <View style={{ width: 32, height: 32, backgroundColor: '#FFD700', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Bot color="#1A2530" size={18} />
                  </View>
                )}
                
                <View style={{
                  flexShrink: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16,
                  backgroundColor: msg.role === 'user' ? '#1A2530' : '#ffffff',
                  borderWidth: msg.role === 'assistant' ? 1 : 0,
                  borderColor: '#e2e8f0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}>
                  {msg.role === 'assistant' && msg.content.includes('Pro tip:') ? (
                    <Text style={{ fontSize: 14, lineHeight: 20, color: '#334155' }}>
                      {msg.content.includes('Pitch Presentation') ? (
                        <>
                          {msg.content.split('clicking here')[0]}
                          <Text 
                            style={{ color: '#0ea5e9', textDecorationLine: 'underline', fontWeight: 'bold' }} 
                            onPress={() => router.push('/presentation')}
                          >
                            clicking here
                          </Text>
                          {msg.content.split('clicking here')[1]}
                        </>
                      ) : msg.content.includes('launch the Fitty App') ? (
                        <>
                          {msg.content.split('clicking here')[0]}
                          <Text 
                            style={{ color: '#0ea5e9', textDecorationLine: 'underline', fontWeight: 'bold' }} 
                            onPress={() => router.push('/')}
                          >
                            clicking here
                          </Text>
                          {msg.content.split('clicking here')[1]}
                        </>
                      ) : (
                        msg.content
                      )}
                    </Text>
                  ) : (
                    <Text style={{
                      fontSize: 14,
                      lineHeight: 20,
                      color: msg.role === 'user' ? '#ffffff' : '#334155'
                    }}>
                      {msg.content}
                    </Text>
                  )}
                </View>
                
                {msg.role === 'user' && (
                  <View style={{ width: 32, height: 32, backgroundColor: '#1A2530', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <User color="#ffffff" size={18} />
                  </View>
                )}
              </View>
            ))}
            {isLoading && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, alignSelf: 'flex-start' }}>
                <View style={{ width: 32, height: 32, backgroundColor: '#FFD700', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Bot color="#1A2530" size={18} />
                </View>
                <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ fontSize: 14, color: '#94a3b8' }}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              padding: 12,
              borderTopWidth: 1,
              borderTopColor: '#f1f5f9',
              backgroundColor: '#ffffff',
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center'
            }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask about Fitty's architecture..."
                placeholderTextColor="#94a3b8"
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#0f172a',
                  //@ts-ignore
                  outlineStyle: 'none'
                }}
                onSubmitEditing={handleSend}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: input.trim() && !isLoading ? '#1A2530' : '#cbd5e1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send color="#ffffff" size={18} style={{ marginLeft: -2 }} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://github.com/gonzagramaglia/fitty')}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#1A2530',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Feather name="github" color="#ffffff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsOpen(true)}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FFD700',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Bot color="#1A2530" size={32} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};
