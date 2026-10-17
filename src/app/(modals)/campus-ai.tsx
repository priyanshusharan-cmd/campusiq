import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  type TextStyle,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from '@/platform/router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from '@/platform/alert';
import { askCampusIQAI, type AIProvider, type AIImage } from '@/features/ai/services/aiService';
import ImageDropZone from '@/platform/ImageDropZone';
import { AssistantAnswer } from '@/features/ai/components/AssistantAnswer';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  provider?: AIProvider;
  notice?: string;
}

export default function CampusAIModal() {
  const router = useRouter();
  const theme = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello there. How can I help you today?",
    },
  ]);
  const [inputFocused, setInputFocused] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<(AIImage & { uri: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
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
    setAttachmentMenu(false);
    
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
      const { reply, isFallback, provider, notice } = await askCampusIQAI(userMessage.content, false, selectedImage ?? undefined);
      setProvider(provider);
      setIsOfflineMode(isFallback);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        provider,
        notice,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setProvider(null);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Could not connect to Gemma. Check your Google key or Mac connection in Settings.',
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
    <ImageDropZone disabled={isLoading} onImage={image => { setAttachment(image); setAttachmentMenu(false); }} onError={message => Alert.alert('Could not attach image', message)}>
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[theme.textStyles.h3, styles.headerTitle, { color: theme.colors.textPrimary }]}>CampusIQ AI</Text>
          {provider && (
            <View style={styles.offlineBadge}>
              <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary }]}>{provider === 'gemma-api' ? 'Gemma · Google' : provider === 'gemma-local' ? 'Gemma · Local' : 'Saved data'}</Text>
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
            {msg.role === 'assistant' ? <>
              {msg.provider && <Text style={[theme.textStyles.smallMedium, { color: theme.colors.textSecondary, marginBottom: 10 }]}>{msg.provider === 'gemma-api' ? 'Gemma · Google' : msg.provider === 'gemma-local' ? 'Gemma · Your Mac' : 'Calculated from saved data'}</Text>}
              <AssistantAnswer content={msg.content} />
              {msg.notice && <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 14 }]}>{msg.notice}</Text>}
            </> : <Text
              style={[
                theme.textStyles.body,
                styles.messageText,
                { color: msg.role === 'user' ? '#fff' : theme.colors.textPrimary }
              ]}
            >
              {msg.content}
            </Text>}
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: theme.colors.surface, alignSelf: 'flex-start' }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      {attachmentMenu && <Pressable accessibilityRole="button" accessibilityLabel="Close attachment menu" onPress={() => setAttachmentMenu(false)} style={[StyleSheet.absoluteFill, { zIndex: 20 }]} />}
      <View style={[styles.composerDock, { backgroundColor: theme.colors.bg }]}>
        <View style={[styles.composer, { backgroundColor: theme.colors.surface, borderColor: inputFocused ? theme.colors.textTertiary : theme.colors.border }]}>
          {attachment && <View style={styles.attachmentTray}>
            <View style={[styles.attachmentTile, { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.bg }]}>
              <Image source={{ uri: attachment.uri }} accessibilityLabel="Image preview" style={styles.attachmentImage} resizeMode="cover" />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove attached image" onPress={() => setAttachment(null)} style={[styles.removeAttachment, { backgroundColor: theme.colors.textPrimary }]}>
                <Ionicons name="close" size={14} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>
          </View>}
          <View style={styles.composerRow}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add attachment" accessibilityState={{ expanded: attachmentMenu }} disabled={isLoading} onPress={() => setAttachmentMenu(!attachmentMenu)} style={styles.addButton}>
              <Ionicons name={attachmentMenu ? 'close' : 'add'} size={26} color={isLoading ? theme.colors.textTertiary : theme.colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              accessibilityLabel="Message CampusIQ"
              style={[theme.textStyles.body, styles.input, Platform.OS === 'web' && webInputStyle, { color: theme.colors.textPrimary }]}
              placeholder="Message CampusIQ…"
              placeholderTextColor={theme.colors.textTertiary}
              value={input}
              onChangeText={setInput}
              onFocus={() => { setAttachmentMenu(false); setInputFocused(true); }}
              onBlur={() => setInputFocused(false)}
              onKeyPress={event => { if (event.nativeEvent.key === 'Escape') setAttachmentMenu(false); }}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: (input.trim() || attachment) && !isLoading ? theme.colors.primary : theme.colors.border }]}
              onPress={sendMessage} accessibilityRole="button" accessibilityLabel="Send message" disabled={(!input.trim() && !attachment) || isLoading}>
              <Ionicons name="arrow-up" size={21} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {attachmentMenu && <View style={[styles.attachmentMenu, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add image" onPress={() => { setAttachmentMenu(false); void pickImage(); }} style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: theme.colors.primaryLight }]}><Ionicons name="image-outline" size={22} color={theme.colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.textPrimary }]}>{attachment ? 'Replace image' : 'Add image'}</Text><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 3 }]}>Choose a photo or screenshot</Text></View>
          </TouchableOpacity>
        </View>}
      </View>
    </KeyboardAvoidingView>
    </ImageDropZone>
  );
}

// React Native's outline type omits the browser-only 'none' value.
const webInputStyle = { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' } as unknown as TextStyle;

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

  },
  titleContainer: {
    alignItems: 'center',
  },
  offlineBadge: {
    marginTop: 2,

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
    alignSelf: 'stretch',
    maxWidth: '100%',
    minWidth: 0,
    padding: 16,
    borderRadius: 16,
  },
  messageText: {

  },
  composerDock: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 30 : 14, zIndex: 30 },
  composer: { borderWidth: 1, borderRadius: 26, padding: 6 },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { flex: 1, minWidth: 0, height: 44, paddingHorizontal: 4 },
  addButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  attachmentTray: { padding: 8, paddingBottom: 5, flexDirection: 'row' },
  attachmentTile: { width: 76, height: 76, borderRadius: 14, borderWidth: 1 },
  attachmentImage: { width: '100%', height: '100%', borderRadius: 13 },
  removeAttachment: { position: 'absolute', top: -5, right: -5, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  attachmentMenu: { position: 'absolute', left: 12, bottom: Platform.OS === 'ios' ? 96 : 80, width: 270, borderWidth: 1, borderRadius: 18, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  menuItem: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, minHeight: 60 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
