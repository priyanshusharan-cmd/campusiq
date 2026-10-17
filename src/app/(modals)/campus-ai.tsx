import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from '@/platform/router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from '@/platform/alert';
import { askCampusIQAI, type AIProvider, type AIImage } from '@/features/ai/services/aiService';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
}

export default function CampusAIModal() {
  const router = useRouter();
  const theme = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm CampusIQ. Connect your Gemma server in Settings for AI answers: cloud API first, then Gemma on your Mac. Without a server I can calculate attendance and grade summaries. Questions and academic summaries are sent to your server, and to Google when Cloud AI is enabled.",
    },
  ]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<(AIImage & { uri: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [provider, setProvider] = useState<AIProvider | null>(null);
  const setIsOfflineMode = useSettingsStore((s) => s.setAiOfflineMode);

  const pickImage = async () => {
    try {
      // Browsers require the picker to open directly from the user's click.
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { Alert.alert('Photo access needed', 'Allow photo access to select an image.'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.65 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const data = asset.base64;
      if (!data) throw new Error('Could not read this image. Try a JPEG or PNG file.');
      if (data.length > 4194304) throw new Error('Choose an image smaller than 3 MB.');
      const mimeType = data.startsWith('/9j/') ? 'image/jpeg' : data.startsWith('iVBORw0KGgo') ? 'image/png' : data.startsWith('UklGR') ? 'image/webp' : null;
      if (!mimeType) throw new Error('Choose a JPEG, PNG, or WebP image.');
      setAttachment({ uri: asset.uri, data, mimeType });
    } catch (error) { Alert.alert('Could not attach image', error instanceof Error ? error.message : 'Try another image.'); }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    const selectedImage = attachment;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || 'Describe this image and explain any academic tasks or deadlines it contains.',
      imageUri: selectedImage?.uri,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachment(null);
    setIsLoading(true);
    
    try {
      const { reply, isFallback, provider } = await askCampusIQAI(userMessage.content, false, selectedImage ?? undefined);
      setProvider(provider);
      setIsOfflineMode(isFallback);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setProvider(null);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Could not connect to Gemma. Check Settings and your server.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isLoading]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>CampusIQ AI</Text>
          {provider && (
            <View style={[styles.offlineBadge, { backgroundColor: theme.colors.warning }]}>
              <Text style={styles.offlineText}>{provider === 'gemma-api' ? 'Gemma API' : provider === 'gemma-local' ? 'Gemma on Mac' : 'Calculations'}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              { 
                backgroundColor: msg.role === 'user' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.borderLight,
              }
            ]}
          >
            {msg.imageUri && <Image source={{ uri: msg.imageUri }} accessibilityLabel="Attached image" style={{ width: 180, height: 130, borderRadius: 12, marginBottom: 8 }} resizeMode="contain" />}
            <Text
              style={[
                styles.messageText,
                { color: msg.role === 'user' ? '#fff' : theme.colors.textPrimary }
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.colors.surface, alignSelf: 'flex-start' }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      {attachment && <View style={{ padding: 12, backgroundColor: theme.colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image source={{ uri: attachment.uri }} accessibilityLabel="Image preview" style={{ width: 72, height: 72, borderRadius: 10 }} resizeMode="contain" />
          <Text style={{ flex: 1, color: theme.colors.textSecondary }}>Image attached · sent only when you press Send</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove attached image" onPress={() => setAttachment(null)} style={{ padding: 8 }}>
            <Ionicons name="close-circle" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>}
      <Text style={{ paddingHorizontal: 12, paddingTop: 4, fontSize: 11, color: theme.colors.textSecondary, backgroundColor: theme.colors.surface }}>
        JPEG, PNG, or WebP · up to 3 MB. Images go to your server and, when enabled, Google. Avoid private documents.
      </Text>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Attach image" disabled={isLoading} onPress={pickImage} style={{ padding: 8, marginRight: 4 }}>
          <Ionicons name="image-outline" size={24} color={isLoading ? theme.colors.textTertiary : theme.colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.bg }]}
          placeholder="Ask or attach a notice..."
          placeholderTextColor={theme.colors.textTertiary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: (input.trim() || attachment) ? theme.colors.primary : theme.colors.border }]}
          onPress={sendMessage}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          disabled={(!input.trim() && !attachment) || isLoading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  offlineBadge: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    borderWidth: 0,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
