import { AssistantActivity } from '@/features/ai/components/AssistantActivity';
import React, { useState, useRef, useCallback } from 'react';
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
  Animated,
  Easing,
  Image,
  Pressable,
  ActionSheetIOS,
  Keyboard,
  InputAccessoryView,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from '@/platform/router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from '@/platform/alert';
import { askCampusIQAI, type AIProvider, type AIImage } from '@/features/ai/services/aiService';
import ImageDropZone from '@/platform/ImageDropZone';
import ChatPasteWrapper from '@/platform/ChatPasteWrapper';
import { AcademicActionReview } from '@/features/ai/components/AcademicActionReview';
import { prepareAcademicActions } from '@/features/ai/services/academicActions';
import { isActionRequest, actionCount, type AcademicActionDraft } from '@/features/ai/services/actionDraft';
import { AssistantAnswer } from '@/features/ai/components/AssistantAnswer';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { triggerHaptic } from '@/utils/haptics';
import { parsePastedImage } from '@/platform/pastedImage';

const providerLabels: Record<AIProvider, string> = {
  'gemma-api': 'Gemma · API',
  'gemma-local': 'Gemma · Local',
  calculations: 'Saved data · Calculations',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  image?: AIImage;
  actionDraft?: AcademicActionDraft;
  actionSaved?: boolean;
  provider?: AIProvider;
  notice?: string;
  pending?: boolean;
  failed?: boolean;
  status?: string;
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
  const [review, setReview] = useState<{ id: string; draft: AcademicActionDraft } | null>(null);
  const [appChangesEnabled, setAppChangesEnabled] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<(AIImage & { uri: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);

  const activeRequest = useRef<AbortController | null>(null);
  const cancelRequest = useCallback(() => {
    if (!activeRequest.current) return;
    activeRequest.current.abort();
    activeRequest.current = null;
    setIsLoading(false);
    setMessages(prev => prev.map(message => message.pending ? { ...message, pending: false, failed: true, status: undefined, content: message.content || 'Request cancelled.' } : message));
  }, []);
  useFocusEffect(useCallback(() => () => cancelRequest(), [cancelRequest]));

  const scrollViewRef = useRef<ScrollView>(null);
  const followLatest = useRef(true);
  const userScrolling = useRef(false);
  const lastScrollOffset = useRef(0);
  const isNearBottom = (event: NativeScrollEvent) => event.contentSize.height - event.layoutMeasurement.height - event.contentOffset.y <= 64;
  const handleChatScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = nativeEvent.contentOffset.y;
    const nearBottom = isNearBottom(nativeEvent);
    // Only a user gesture or upward scroll can pause following. Content growth alone cannot.
    if (userScrolling.current || offset < lastScrollOffset.current - 1) followLatest.current = nearBottom;
    else if (nearBottom) followLatest.current = true;
    lastScrollOffset.current = offset;
  };
  const endUserScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    userScrolling.current = false;
    followLatest.current = isNearBottom(nativeEvent);
  };
  const followNewContent = () => {
    if (followLatest.current && !userScrolling.current) scrollViewRef.current?.scrollToEnd({ animated: false });
  };
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const setIsOfflineMode = useSettingsStore((s) => s.setAiOfflineMode);

  const [attachmentRotation] = useState(() => new Animated.Value(0));
  const [menuAnim] = useState(() => new Animated.Value(0));
  const [attachmentAnim] = useState(() => new Animated.Value(0));

  const closeAttachmentMenu = useCallback(() => {
    Animated.parallel([
      Animated.timing(attachmentRotation, {
        toValue: 0,
        duration: 180,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setAttachmentMenu(false);
    });
  }, [attachmentRotation, menuAnim]);

  const toggleAttachmentMenu = useCallback(() => {
    triggerHaptic('selection');
    if (attachmentMenu) {
      closeAttachmentMenu();
    } else {
      setAttachmentMenu(true);
      Animated.parallel([
        Animated.timing(attachmentRotation, {
          toValue: 1,
          duration: 200,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(menuAnim, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [attachmentMenu, closeAttachmentMenu, attachmentRotation, menuAnim]);

  const animateAttachmentIn = useCallback((item: AIImage & { uri: string }) => {
    attachmentAnim.setValue(0);
    setAttachment(item);
    Animated.spring(attachmentAnim, {
      toValue: 1,
      friction: 6,
      tension: 70,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [attachmentAnim]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') Keyboard.dismiss();
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.65 });
      if (result.canceled) return;
      const asset = result.assets[0];
      const data = asset.base64;
      if (!data) throw new Error('Could not read this image. Try a JPEG or PNG file.');
      if (data.length > 4194304) throw new Error('Choose an image smaller than 3 MB.');
      const mimeType = data.startsWith('/9j/') ? 'image/jpeg' : data.startsWith('iVBORw0KGgo') ? 'image/png' : data.startsWith('UklGR') ? 'image/webp' : null;
      if (!mimeType) throw new Error('Choose a JPEG, PNG, or WebP image.');
      animateAttachmentIn({ uri: asset.uri, data, mimeType });
      triggerHaptic('success');
    } catch (error) { Alert.alert('Could not attach image', error instanceof Error ? error.message : 'Try another image.'); }
  };

  const removeAttachmentAnimated = useCallback(() => {
    triggerHaptic('light');
    Animated.timing(attachmentAnim, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setAttachment(null);
    });
  }, [attachmentAnim]);

  const handleInputChange = (text: string) => {
    const match = /data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+/.exec(text);
    if (match) {
      try {
        const parsed = parsePastedImage(match[0]);
        animateAttachmentIn(parsed);
        triggerHaptic('success');
        const remaining = text.replace(match[0], '').trim();
        setInput(remaining);
        return;
      } catch {
        // Fall back to setting text
      }
    }
    setInput(text);
  };

  const openAppChanges = () => {
    setAttachmentMenu(false);
    if (appChangesEnabled) {
      Alert.alert('AI app changes are on', 'The assistant can prepare changes to your CampusIQ data in this chat. You review and confirm before anything is saved. Turn this off to return to regular chat.', [
        { text: 'Keep enabled', style: 'cancel' },
        { text: 'Turn off', onPress: () => { setAppChangesEnabled(false); setReview(null); } },
      ]);
      return;
    }
    Alert.alert('Let AI update CampusIQ?', 'Ask the assistant to manage subjects, schedules, attendance, results, assignments and more using your chosen local or cloud model.\n\nAI is not always reliable and can misread images, misunderstand requests or make mistakes. Check every proposed change, especially dates and bulk attendance. Nothing is saved until you review and confirm.\n\nTap Okay to enable app changes for this chat. You can turn them off with this lightning button.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Okay', onPress: () => setAppChangesEnabled(true) },
    ]);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachment) || isLoading || activeRequest.current) return;
    if (isActionRequest(input) && !appChangesEnabled) { openAppChanges(); return; }
    const wantsChanges = appChangesEnabled;
    const selectedImage = attachment;
    setAttachmentMenu(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (appChangesEnabled ? 'Add the subjects and weekly classes from this timetable to my app. Prepare changes for review; do not guess unclear details.' : 'Describe this image and explain any academic tasks or deadlines it contains.'),
      imageUri: attachment?.uri,
      image: selectedImage ?? undefined,
    };

    const controller = new AbortController();
    activeRequest.current = controller;
    const isCurrentRequest = () => activeRequest.current === controller && !controller.signal.aborted;
    followLatest.current = true;
    userScrolling.current = false;
    const answerId = `${userMessage.id}-answer`;
    const status = wantsChanges ? 'Preparing proposed app changes…' : selectedImage ? 'Preparing your image response…' : 'Preparing your answer…';
    setMessages((prev) => [...prev, userMessage, { id: answerId, role: 'assistant', content: '', pending: true, status }]);
    setInput('');
    setAttachment(null);
    setIsLoading(true);
    setProvider(null);

    try {
      if (wantsChanges) {
        const previousProposal = [...messages].reverse().find(message => message.actionDraft);
        const pendingDraft = !selectedImage && previousProposal && !previousProposal.actionSaved ? previousProposal.actionDraft : undefined;
        const prepared = await prepareAcademicActions(userMessage.content, selectedImage ?? undefined, messages.filter(msg => !msg.pending), controller.signal, progress => {
          if (!isCurrentRequest()) return;
          setProvider(progress.provider ?? null);
          setMessages(prev => prev.map(msg => msg.id === answerId ? { ...msg, content: progress.content, provider: progress.provider, status: progress.status } : msg));
        }, pendingDraft);
        if (!isCurrentRequest()) return;
        setProvider(prepared.provider);
        setIsOfflineMode(prepared.isFallback);
        const count = actionCount(prepared.draft);
        if (count) { Keyboard.dismiss(); setReview({ id: answerId, draft: prepared.draft }); }
        setMessages(prev => prev.map(msg => msg.id === answerId ? { id: answerId, role: 'assistant', provider: prepared.provider, notice: prepared.notice, content: count ? `${prepared.draft.message || 'Your proposed changes are ready.'}\n\nReview and confirm to save them in CampusIQ.` : prepared.draft.message || 'What would you like help with?', actionDraft: count ? prepared.draft : undefined } : msg));
        return;
      }
      const { reply, isFallback, provider, notice } = await askCampusIQAI(userMessage.content, false, selectedImage ?? undefined, progress => {
        if (!isCurrentRequest()) return;
        setProvider(progress.provider ?? null);
        setMessages(prev => prev.map(msg => msg.id === answerId ? { ...msg, content: progress.content, provider: progress.provider, status: progress.status } : msg));
      }, { history: messages, signal: controller.signal });
      if (!isCurrentRequest()) return;
      setProvider(provider);
      setIsOfflineMode(isFallback);

      const assistantMessage: Message = {
        id: answerId,
        role: 'assistant',
        content: reply,
        provider,
        notice,
      };
      setMessages(prev => prev.map(msg => msg.id === answerId ? assistantMessage : msg));
    } catch (error) {
      if (!isCurrentRequest()) return;
      setProvider(null);
      const errorMessage: Message = {
        id: answerId,
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Could not connect to Gemma. Check your Google key or local device connection in Settings.',
        failed: true,
      };
      setMessages(prev => prev.map(msg => msg.id === answerId ? errorMessage : msg));
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setIsLoading(false); }
    }
  };

  const cloudAiEnabled = useSettingsStore((s) => s.cloudAiEnabled);
  const useOfflineAIFallback = useSettingsStore((s) => s.useOfflineAIFallback);
  const aiOfflineMode = useSettingsStore((s) => s.aiOfflineMode);
  const setAiMode = useSettingsStore((s) => s.setAiMode);

  // Directly derive the mode from user settings
  const activeModeLabel = (!cloudAiEnabled && !useOfflineAIFallback)
    ? 'Deterministic'
    : !cloudAiEnabled
    ? 'Gemma Local'
    : !useOfflineAIFallback
    ? 'Gemma Cloud'
    : 'Automatic';

  const openModelPicker = () => {
    const options = [
      'Cancel',
      'Automatic',
      'Gemma Cloud',
      'Gemma Local',
      'Deterministic',
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) { setAiMode('automatic'); setProvider(null); }
          if (buttonIndex === 2) { setAiMode('google'); setProvider(null); }
          if (buttonIndex === 3) { setAiMode('mac'); setProvider(null); }
          if (buttonIndex === 4) { setAiMode('offline'); setProvider(null); }
        }
      );
    } else {
      Alert.alert('Choose AI Model', 'Select how CampusIQ processes your requests', [
        { text: 'Automatic', onPress: () => { setAiMode('automatic'); setProvider(null); } },
        { text: 'Gemma Cloud', onPress: () => { setAiMode('google'); setProvider(null); } },
        { text: 'Gemma Local', onPress: () => { setAiMode('mac'); setProvider(null); } },
        { text: 'Deterministic', onPress: () => { setAiMode('offline'); setProvider(null); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <ImageDropZone disabled={isLoading} onImage={image => { setAttachment(image); setAttachmentMenu(false); }} onError={message => Alert.alert('Could not attach image', message)}>
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close chat" onPress={() => { cancelRequest(); router.back(); }} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[theme.textStyles.h3, styles.headerTitle, { color: theme.colors.textPrimary }]}>CampusIQ AI</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Switch AI model"
            onPress={openModelPicker}
            style={styles.modelBadgeButton}
            activeOpacity={0.7}
          >
            <Text style={[theme.textStyles.small, { color: theme.colors.primary, fontWeight: '600' }]}>
              {activeModeLabel}
            </Text>
            <Ionicons name="chevron-down" size={13} color={theme.colors.primary} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={appChangesEnabled ? 'AI app changes enabled' : 'Enable AI app changes'} accessibilityState={{ selected: appChangesEnabled, disabled: isLoading }} disabled={isLoading} onPress={openAppChanges} style={[styles.headerRight, { backgroundColor: appChangesEnabled ? theme.colors.primaryLight : 'transparent', opacity: isLoading ? 0.5 : 1 }]}>
          <Ionicons name={appChangesEnabled ? 'flash' : 'flash-outline'} size={23} color={appChangesEnabled ? theme.colors.primary : theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        onScroll={handleChatScroll}
        onScrollBeginDrag={() => { userScrolling.current = true; followLatest.current = false; }}
        onScrollEndDrag={endUserScroll}
        onMomentumScrollBegin={() => { userScrolling.current = true; }}
        onMomentumScrollEnd={endUserScroll}
        onContentSizeChange={followNewContent}
        onLayout={followNewContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              msg.id === 'welcome' && styles.welcomeBubble,
              {
                backgroundColor: msg.role === 'user' ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.borderLight,
              }
            ]}
          >
            {msg.imageUri && <Image source={{ uri: msg.imageUri }} accessibilityLabel="Attached image" style={{ width: 180, height: 130, borderRadius: 12, marginBottom: 8 }} resizeMode="contain" />}
            {msg.role === 'assistant' ? <>
              {msg.provider && <Text style={[theme.textStyles.smallMedium, { color: theme.colors.textSecondary, marginBottom: 10 }]}>{providerLabels[msg.provider]}</Text>}
              {msg.pending && <AssistantActivity status={msg.status} />}
              {msg.pending && !msg.content ? null : msg.id === 'welcome' ? <Text style={[theme.textStyles.body, { color: theme.colors.textPrimary }]}>{msg.content}</Text> : <AssistantAnswer content={msg.content} />}
              {msg.actionDraft && <TouchableOpacity accessibilityRole="button" disabled={msg.actionSaved} onPress={() => { if (!appChangesEnabled) { openAppChanges(); return; } setReview({ id: msg.id, draft: msg.actionDraft! }); }} style={[styles.reviewButton, { backgroundColor: msg.actionSaved ? theme.colors.bg : theme.colors.primary }]}>
                <Text style={[theme.textStyles.bodyMedium, { color: msg.actionSaved ? theme.colors.textSecondary : '#fff' }]}>{msg.actionSaved ? 'Changes saved' : 'Review app changes'}</Text>
              </TouchableOpacity>}
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
      </ScrollView>

      {attachmentMenu && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close attachment menu"
          onPress={closeAttachmentMenu}
          style={[StyleSheet.absoluteFill, { zIndex: 20 }]}
        />
      )}
      <View style={[styles.composerDock, { backgroundColor: theme.colors.bg }]}>
        {attachmentMenu && (
          <Animated.View
            style={[
              styles.attachmentMenu,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: menuAnim,
                transform: [
                  { scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
                  { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose from photo library"
              onPress={() => {
                closeAttachmentMenu();
                void pickImage();
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="images-outline" size={21} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.textStyles.bodyMedium, { color: theme.colors.textPrimary }]}>
                  {attachment ? 'Replace photo' : 'Choose photo'}
                </Text>
                <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                  From photo library
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={[styles.composer, { backgroundColor: theme.colors.surface, borderColor: inputFocused ? theme.colors.textTertiary : theme.colors.border }]}>
          {attachment && (
            <Animated.View
              style={[
                styles.attachmentTray,
                {
                  opacity: attachmentAnim,
                  transform: [
                    { scale: attachmentAnim },
                    { translateY: attachmentAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                  ],
                },
              ]}
            >
              <View style={[styles.attachmentTile, { borderColor: theme.colors.borderLight, backgroundColor: theme.colors.bg }]}>
                <Image source={{ uri: attachment.uri }} accessibilityLabel="Image preview" style={styles.attachmentImage} resizeMode="cover" />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Remove attached image"
                  onPress={removeAttachmentAnimated}
                  style={[styles.removeAttachment, { backgroundColor: theme.colors.textPrimary }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={14} color={theme.colors.surface} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          <View style={styles.composerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={attachmentMenu ? 'Close attachment menu' : 'Add attachment'}
              accessibilityState={{ expanded: attachmentMenu }}
              disabled={isLoading}
              onPress={toggleAttachmentMenu}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ rotate: attachmentRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}>
                <Ionicons name="add" size={26} color={isLoading ? theme.colors.textTertiary : theme.colors.textSecondary} />
              </Animated.View>
            </TouchableOpacity>
            <ChatPasteWrapper disabled={isLoading} onImage={image => { animateAttachmentIn(image); triggerHaptic('success'); closeAttachmentMenu(); }} onError={message => Alert.alert('Could not paste photo', message)}>
            <TextInput
              accessibilityLabel="Message CampusIQ"
              inputAccessoryViewID={Platform.OS === 'ios' ? 'campusiq-chat-keyboard' : undefined}
              style={[theme.textStyles.body, styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Message CampusIQ…"
              placeholderTextColor={theme.colors.textTertiary}
              value={input}
              onChangeText={handleInputChange}
              onFocus={() => {
                closeAttachmentMenu();
                setInputFocused(true);
              }}
              onBlur={() => setInputFocused(false)}
              onKeyPress={event => { if (event.nativeEvent.key === 'Escape') closeAttachmentMenu(); }}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            </ChatPasteWrapper>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: (input.trim() || attachment) && !isLoading ? theme.colors.primary : theme.colors.border }]}
              onPress={sendMessage}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={(!input.trim() && !attachment) || isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={21} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {Platform.OS === 'ios' && <InputAccessoryView nativeID="campusiq-chat-keyboard" backgroundColor={theme.colors.surface}>
        <View style={[styles.keyboardToolbar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Hide keyboard" onPress={() => Keyboard.dismiss()} style={styles.hideKeyboardButton}>
            <Ionicons name="chevron-down" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </InputAccessoryView>}
      {review && appChangesEnabled && <AcademicActionReview key={review.id} initial={review.draft} onDraftChange={draft => setMessages(previous => previous.map(message => message.id === review.id && message.actionDraft !== draft ? { ...message, actionDraft: draft } : message))} onClose={() => setReview(null)} onSaved={summary => {
        setMessages(prev => prev.map(msg => msg.id === review.id ? { ...msg, content: `Saved to CampusIQ.\n\n${summary}`, actionSaved: true } : msg));
        setReview(null);
      }} />}
    </KeyboardAvoidingView>
    </ImageDropZone>
  );
}

const styles = StyleSheet.create({
  keyboardToolbar: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth },
  hideKeyboardButton: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
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
  modelBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  offlineBadge: {
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  reviewButton: { marginTop: 14, padding: 12, borderRadius: 10, alignItems: 'center' },
  answerStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  welcomeBubble: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomLeftRadius: 6,
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
  attachmentMenu: { alignSelf: 'flex-start', marginBottom: 8, width: 270, borderWidth: 1, borderRadius: 18, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  menuItem: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, minHeight: 56 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
