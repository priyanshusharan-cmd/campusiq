import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { SectionHeader } from '@/components/ui';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getGoogleApiKey, setGoogleApiKey } from '@/platform/googleApiKey';
import { checkGoogleConnection, checkMacConnection, normalizeMacAddress } from '@/features/ai/services/connectionChecks';
import { CLOUD_MODEL, LOCAL_MODEL } from '@/features/ai/services/aiService';

type Mode = 'automatic' | 'google' | 'mac';
type Check = { kind: 'idle' | 'checking' | 'success' | 'error'; message: string };
const idle: Check = { kind: 'idle', message: '' };
const MODES: { id: Mode; icon: keyof typeof Ionicons.glyphMap; title: string; detail: string }[] = [
  { id: 'automatic', icon: 'swap-horizontal-outline', title: 'Automatic', detail: 'Google first. Your Mac is the backup.' },
  { id: 'google', icon: 'cloud-outline', title: 'Google only', detail: 'Use the internet. Your Mac can be off.' },
  { id: 'mac', icon: 'desktop-outline', title: 'My Mac only', detail: 'Use Ollama over your local Wi-Fi.' },
];

function SettingsAction({ label, onPress, primary = false, disabled = false }: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  const { colors: c, textStyles: t } = useTheme();
  return <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, { backgroundColor: primary ? c.primary : c.bg, borderColor: primary ? c.primary : c.border, opacity: disabled ? 0.5 : 1 }]}>
    <Text style={[t.smallMedium, { color: primary ? c.white : c.textPrimary, textAlign: 'center' }]}>{label}</Text>
  </TouchableOpacity>;
}

export default function AISettingsPanel() {
  const { colors: c, textStyles: t } = useTheme();
  const settings = useSettingsStore();
  const mode: Mode = settings.cloudAiEnabled ? settings.useOfflineAIFallback ? 'automatic' : 'google' : 'mac';
  const [hasKey, setHasKey] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState(false);
  const [keyDraft, setKeyDraft] = React.useState('');
  const [keyError, setKeyError] = React.useState('');
  const [savingKey, setSavingKey] = React.useState(false);
  const [editingMac, setEditingMac] = React.useState(false);
  const [address, setAddress] = React.useState(settings.macOllamaUrl);
  const [addressError, setAddressError] = React.useState('');
  const [googleCheck, setGoogleCheck] = React.useState<Check>(idle);
  const [macCheck, setMacCheck] = React.useState<Check>(idle);
  const [details, setDetails] = React.useState(false);
  const [privacy, setPrivacy] = React.useState(false);
  const mounted = React.useRef(true);
  const macRevision = React.useRef(0);
  const googleRevision = React.useRef(0);
  React.useEffect(() => {
    mounted.current = true;
    getGoogleApiKey().then(key => { if (mounted.current) setHasKey(Boolean(key)); }).catch(() => { if (mounted.current) setKeyError('Could not read saved key. Add it again to continue.'); });
    return () => { mounted.current = false; };
  }, []);

  const caption = { ...t.small, color: c.textSecondary };
  const title = { ...t.bodyMedium, color: c.textPrimary };
  const card = [styles.card, { backgroundColor: c.surface, borderColor: c.borderLight }];
  const badge = (text: string, active = false) => <View style={[styles.badge, { backgroundColor: active ? c.primaryLight : c.bg }]}><Text style={[t.caption, { color: active ? c.primary : c.textSecondary }]}>{text}</Text></View>;
  const status = (check: Check) => check.kind === 'idle' ? null : (
    <View accessibilityLiveRegion="polite" style={[styles.status, { backgroundColor: c.bg }]}>
      {check.kind === 'checking' ? <ActivityIndicator size="small" color={c.primary} /> : <Ionicons name={check.kind === 'success' ? 'checkmark-circle' : 'alert-circle-outline'} size={18} color={check.kind === 'success' ? c.success : c.warning} />}
      <Text style={[caption, { flex: 1 }]}>{check.message}</Text>
    </View>
  );
  const runCheck = async (provider: 'google' | 'mac') => {
    const setter = provider === 'google' ? setGoogleCheck : setMacCheck;
    const revision = provider === 'google' ? googleRevision.current : macRevision.current;
    setter({ kind: 'checking', message: provider === 'google' ? 'Asking Google for a short test response…' : 'Checking Ollama and the installed model…' });
    try {
      const message = provider === 'google' ? await checkGoogleConnection(await getGoogleApiKey()) : await checkMacConnection(settings.macOllamaUrl);
      if (mounted.current && revision === (provider === 'google' ? googleRevision.current : macRevision.current)) setter({ kind: 'success', message });
    } catch (error) {
      const message = error instanceof Error && !/fetch|network|abort/i.test(error.message) ? error.message : provider === 'google' ? 'Could not reach Google. Check your internet connection and try again.' : 'Mac not reachable. Check the address, Wi-Fi, firewall, and that Ollama is open.';
      if (mounted.current && revision === (provider === 'google' ? googleRevision.current : macRevision.current)) setter({ kind: 'error', message });
    }
  };
  const saveKey = async (value: string) => {
    setSavingKey(true); setKeyError('');
    try {
      await setGoogleApiKey(value);
      if (!mounted.current) return;
      googleRevision.current++; setGoogleCheck(idle); setHasKey(Boolean(value.trim())); setEditingKey(false); setKeyDraft('');
    } catch { if (mounted.current) setKeyError('Could not save the key. Please try again.'); }
    finally { if (mounted.current) setSavingKey(false); }
  };
  const saveMac = () => {
    try {
      const normalized = normalizeMacAddress(address);
      settings.setMacOllamaUrl(normalized); setAddress(normalized); setEditingMac(false); setAddressError('');
      macRevision.current++; setMacCheck(idle);
    } catch (error) { setAddressError(error instanceof Error ? error.message : 'Check the address and try again.'); }
  };

  return <View style={{ gap: 14, marginBottom: 28 }}>
    <SectionHeader title="AI Assistant" />

    <View style={card}>
      <Text style={title}>Answer preference</Text>
      <View accessibilityRole="radiogroup" style={{ gap: 9 }}>
        {MODES.map(item => {
          const selected = mode === item.id;
          return <TouchableOpacity key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${item.title}. ${item.detail}`}
            onPress={() => settings.setAiMode(item.id)} style={[styles.mode, { borderColor: selected ? c.primary : c.borderLight, backgroundColor: selected ? c.primaryLight : c.surface }]}>
            <Ionicons name={item.icon} size={20} color={selected ? c.primary : c.textSecondary} />
            <View style={{ flex: 1, gap: 3 }}><View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 }}><Text style={title}>{item.title}</Text>{item.id === 'automatic' && badge('RECOMMENDED', selected)}</View><Text style={caption}>{item.detail}</Text></View>
            <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={21} color={selected ? c.primary : c.textTertiary} />
          </TouchableOpacity>;
        })}
      </View>
      <View style={[styles.route, { backgroundColor: c.bg }]}><Ionicons name="git-branch-outline" size={17} color={c.primary} /><Text style={[caption, { flex: 1 }]}>{mode === 'automatic' ? 'Google first · your phone switches to Mac if needed' : mode === 'google' ? 'Your phone → Google. No Mac connection.' : 'Your phone → your Mac. No Google requests.'}</Text></View>
    </View>

    <View style={card}>
      <View style={styles.cardHeader}><View style={[styles.icon, { backgroundColor: c.infoLight }]}><Ionicons name="cloud-outline" size={20} color={c.info} /></View><View style={{ flex: 1, gap: 3 }}><Text style={title}>Gemma by Google</Text><Text style={caption}>Connect once. Use it from anywhere.</Text></View></View>
      <View style={styles.badgeRow}>{badge(mode === 'mac' ? 'NOT USED IN MAC MODE' : 'PRIMARY', mode !== 'mac')}{badge(googleCheck.kind === 'success' ? 'CONNECTION VERIFIED' : hasKey ? 'KEY SAVED · NOT VERIFIED' : 'SETUP NEEDED', googleCheck.kind === 'success')}</View>
      <Text style={caption}>Your phone talks directly to Google. Your Mac can be off. Add your own Google AI Studio key from a project on the free tier.</Text>
      {editingKey ? <View style={[styles.editor, { backgroundColor: c.bg }]}>
        <Text style={title}>{hasKey ? 'Replace your API key' : 'Add your API key'}</Text>
        <Text style={caption}>{Platform.OS === 'web' ? 'Stored only for this browser session. Reloading clears it.' : 'Saved in secure storage on this phone. Never included in the app build.'}</Text>
        <TextInput accessibilityLabel="Google AI Studio API key" placeholder="Paste your Google API key" placeholderTextColor={c.textTertiary} value={keyDraft} onChangeText={setKeyDraft} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[t.body, styles.input, { backgroundColor: c.surface, color: c.textPrimary, borderColor: c.border }]} />
        <View style={styles.actions}>{<SettingsAction label={'Cancel'} onPress={() => { setEditingKey(false); setKeyDraft(''); setKeyError(''); }} primary={false} disabled={savingKey} />}{<SettingsAction label={savingKey ? 'Saving…' : 'Save key'} onPress={() => { void saveKey(keyDraft); }} primary={true} disabled={savingKey || !keyDraft.trim()} />}</View>
      </View> : <View style={styles.actions}>{<SettingsAction label={hasKey ? 'Replace key' : 'Set up Google'} onPress={() => { setKeyDraft(''); setEditingKey(true); }} primary={true} />}{<SettingsAction label={googleCheck.kind === 'checking' ? 'Testing…' : 'Test connection'} onPress={() => { void runCheck('google'); }} primary={false} disabled={!hasKey || googleCheck.kind === 'checking' || mode === 'mac'} />}</View>}
      {hasKey && !editingKey && <TouchableOpacity accessibilityRole="button" onPress={() => { void saveKey(''); }} disabled={savingKey}><Text style={[t.small, { color: c.textSecondary, textDecorationLine: 'underline' }]}>Remove saved key</Text></TouchableOpacity>}
      {!!keyError && <Text accessibilityLiveRegion="polite" style={[caption, { color: c.warning }]}>{keyError}</Text>}
      {status(googleCheck)}
      <Text style={caption}>Testing sends one tiny prompt to Google and uses a little free quota. Free-tier limits apply; a saved key alone does not prove a working connection.</Text>
    </View>

    <View style={card}>
      <View style={styles.cardHeader}><View style={[styles.icon, { backgroundColor: c.primaryLight }]}><Ionicons name="desktop-outline" size={20} color={c.primary} /></View><View style={{ flex: 1, gap: 3 }}><Text style={title}>Gemma on your Mac</Text><Text style={caption}>A local backup, powered by Ollama.</Text></View></View>
      <View style={styles.badgeRow}>{badge(mode === 'mac' ? 'PRIMARY' : mode === 'google' ? 'NOT USED IN GOOGLE MODE' : 'OPTIONAL BACKUP', mode === 'mac')}{badge(macCheck.kind === 'success' ? 'MODEL FOUND' : settings.macOllamaUrl ? 'ADDRESS SAVED · NOT VERIFIED' : 'NOT CONNECTED', macCheck.kind === 'success')}</View>
      <Text style={caption}>Your Mac runs the model and sends the answer back to your phone. Keep both devices on the same trusted Wi-Fi, your Mac awake, and Ollama open.</Text>
      {editingMac ? <View style={[styles.editor, { backgroundColor: c.bg }]}>
        <Text style={title}>Your Mac’s Wi-Fi address</Text><Text style={caption}>Enter the address and port, such as 192.168.1.52:11434. The app adds the connection details for you.</Text>
        <TextInput accessibilityLabel="Mac Wi-Fi address" value={address} onChangeText={setAddress} placeholder="192.168.1.52:11434" placeholderTextColor={c.textTertiary} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={[t.body, styles.input, { backgroundColor: c.surface, color: c.textPrimary, borderColor: c.border }]} />
        {!!addressError && <Text accessibilityLiveRegion="polite" style={[caption, { color: c.warning }]}>{addressError}</Text>}
        <View style={styles.actions}>{<SettingsAction label={'Cancel'} onPress={() => { setEditingMac(false); setAddressError(''); }} />}{<SettingsAction label={'Save address'} onPress={saveMac} primary={true} />}</View>
      </View> : <View style={styles.actions}>{<SettingsAction label={settings.macOllamaUrl ? 'Edit address' : 'Connect my Mac'} onPress={() => { setAddress(settings.macOllamaUrl); setEditingMac(true); }} primary={true} />}{<SettingsAction label={macCheck.kind === 'checking' ? 'Checking…' : 'Check connection'} onPress={() => { void runCheck('mac'); }} primary={false} disabled={!settings.macOllamaUrl || macCheck.kind === 'checking' || mode === 'google'} />}</View>}
      {status(macCheck)}
      <Text style={caption}>Connection checks read Ollama’s installed-model list. They do not generate an answer or use Google quota.</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(!details)} style={styles.disclosure}><Text style={[t.smallMedium, { color: c.primary }]}>How the Mac connection works</Text><Ionicons name={details ? 'chevron-up' : 'chevron-down'} size={17} color={c.primary} /></TouchableOpacity>
      {details && <View style={[styles.editor, { backgroundColor: c.bg }]}>
        <Text style={caption}>1. Open Ollama on your Mac and keep Gemma installed.</Text>
        <Text style={caption}>2. Use your Mac’s Wi-Fi IP from System Settings → Wi-Fi → Details → TCP/IP. “localhost” on your iPhone means the iPhone itself.</Text>
        <Text style={caption}>3. Ollama must allow local-network connections. Approve local-network or firewall access if your devices ask.</Text>
        <Text style={caption}>The address locates Ollama. Port 11434 is its usual entry point; CampusIQ adds /api/chat. The model files stay on your Mac.</Text>
        <Text selectable style={caption}>Saved address: {settings.macOllamaUrl || 'None yet'}{'\n'}Local model: {LOCAL_MODEL}{'\n'}Google model: {CLOUD_MODEL}</Text>
        <Text style={caption}>Your Wi-Fi address can change. A hosted HTTPS browser may block an HTTP Mac connection; use the native phone app or local browser preview. Keep Ollama on your trusted network.</Text>
      </View>}
    </View>

    <View style={card}>
      <View style={styles.cardHeader}><View style={[styles.icon, { backgroundColor: c.bg }]}><Ionicons name="calculator-outline" size={20} color={c.textSecondary} /></View><View style={{ flex: 1, gap: 3 }}><Text style={title}>Basic offline help</Text><Text style={caption}>Still useful when AI is unavailable.</Text></View><Switch accessibilityLabel="Basic offline help" value={settings.basicOfflineHelp} onValueChange={settings.toggleBasicOfflineHelp} trackColor={{ false: c.border, true: c.primary }} /></View>
      <Text style={caption}>Calculate attendance and summarize grades without a model. These answers are labeled “Offline calculations.” Images require Google or Gemma on your Mac.</Text>
    </View>

    <View style={[styles.privacy, { backgroundColor: c.primaryLight }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: privacy }} onPress={() => setPrivacy(!privacy)} style={styles.cardHeader}><Ionicons name="shield-checkmark-outline" size={21} color={c.primary} /><Text style={[title, { flex: 1 }]}>What gets shared?</Text><Ionicons name={privacy ? 'chevron-up' : 'chevron-down'} size={18} color={c.primary} /></TouchableOpacity>
      <Text style={caption}>Cloud requests go to Google. Local requests go to your Mac.</Text>
      {privacy && <Text style={caption}>In Automatic mode, a failed Google attempt may be followed by a Mac request. Google receives your question, academic summary, and attached image for cloud attempts. Local requests go to Ollama on your Mac; your Google key is never sent there. Offline calculations stay in the app. Free-tier Google content may be used to improve its products. Prefer sample data for public demos.</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  mode: { flexDirection: 'row', gap: 12, padding: 13, alignItems: 'center', borderWidth: 1.5, borderRadius: 15 },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 11 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, alignSelf: 'flex-start' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  button: { paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 11, flexGrow: 1, minHeight: 44, justifyContent: 'center' },
  editor: { borderRadius: 13, padding: 13, gap: 11 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, minHeight: 46 },
  status: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 11, borderRadius: 11 },
  disclosure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 34 },
  privacy: { padding: 16, borderRadius: 18, gap: 9 },
});
