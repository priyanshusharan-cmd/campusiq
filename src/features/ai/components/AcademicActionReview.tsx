import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ColorPicker, IconPicker, SegmentedControl } from '@/components/form';
import { useTheme } from '@/theme';
import DateTimePicker from '@/platform/dateTimePicker';
import { formatTime } from '@/lib';
import { useProfileStore } from '@/stores/useProfileStore';
import { useAcademicStore } from '@/stores/useAcademicStore';
import { actionSnapshot, applyAcademicActions, previewAcademicActions } from '../services/applyAcademicActions';
import { classReviewIssues, normalizeSubjectActions, type AcademicActionDraft } from '../services/actionDraft';

type Section = 'subjects' | 'classes' | 'results' | 'assignments' | 'exams' | 'attendance' | 'attendanceRanges' | 'changes';
const sections: { key: Section; title: string; fields: [string, string][] }[] = [
  { key: 'changes', title: 'Edit or delete saved items', fields: [['value', 'New value']] },
  { key: 'attendanceRanges', title: 'Attendance by date range', fields: [['subject', 'Subject name/code (blank: all in semester)'], ['from', 'From · YYYY-MM-DD'], ['to', 'Through · YYYY-MM-DD'], ['start', 'Class start (blank: all times)'], ['day', 'Weekday: Mon 0 → Sun 6 (blank: all)'], ['status', 'present / absent / cancelled / holiday / unmarked']] },
  { key: 'subjects', title: 'Subjects', fields: [['name', 'Subject name'], ['code', 'Code (optional)'], ['faculty', 'Faculty (optional)'], ['credits', 'Credits (unknown: blank)'], ['type', 'Subject type'], ['description', 'Description (optional)'], ['color', 'Color'], ['icon', 'Subject icon']] },
  { key: 'classes', title: 'Classes', fields: [['subject', 'Subject name or code'], ['day', 'Day: Mon 0 → Sun 6'], ['date', 'Specific date (blank: weekly)'], ['start', 'Start · HH:MM'], ['end', 'End · HH:MM'], ['room', 'Room'], ['type', 'lecture or lab']] },
  { key: 'results', title: 'Semester results', fields: [['subject', 'Subject name or code'], ['code', 'Code (optional)'], ['credits', 'Credits'], ['marks', 'Final course marks'], ['maxMarks', 'Maximum marks'], ['grade', 'Grade letter'], ['gradePoint', 'Grade point · 0–10']] },
  { key: 'assignments', title: 'Assignments', fields: [['subject', 'Subject name or code'], ['title', 'Title'], ['date', 'Due · YYYY-MM-DD'], ['notes', 'Notes'], ['priority', 'Priority']] },
  { key: 'exams', title: 'Exams', fields: [['subject', 'Subject name or code'], ['date', 'Date · YYYY-MM-DD'], ['start', 'Start · HH:MM (optional)'], ['room', 'Room'], ['type', 'midsem / endsem / quiz / viva / practical / assignment'], ['notes', 'Notes'], ['syllabus', 'Syllabus']] },
  { key: 'attendance', title: 'Attendance', fields: [['subject', 'Subject name or code'], ['date', 'Date · YYYY-MM-DD'], ['start', 'Class start · HH:MM'], ['status', 'present / absent / cancelled / holiday'], ['note', 'Attendance note']] },
];
const numeric = new Set(['credits', 'day', 'marks', 'maxMarks', 'gradePoint']);

function ReviewTextField({ label, value, onCommit, onFocus, onBlur, numeric, multiline }: { label: string; value: string; onCommit: (value: string) => void; onFocus: () => void; onBlur: () => void; numeric: boolean; multiline: boolean }) {
  const theme = useTheme();
  const [buffer, setBuffer] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setBuffer(value); }, [value, focused]);
  return <View style={styles.field}><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginBottom: 6 }]}>{label}</Text><TextInput accessibilityLabel={label} value={buffer} onChangeText={setBuffer}
    onFocus={() => { setFocused(true); onFocus(); }}
    onBlur={() => { onCommit(buffer); setFocused(false); onBlur(); }}
    keyboardType={numeric ? 'decimal-pad' : 'default'} autoCapitalize="none" autoCorrect={false} spellCheck={false}
    returnKeyType={multiline ? 'default' : 'done'} onSubmitEditing={multiline ? undefined : Keyboard.dismiss} blurOnSubmit={!multiline} multiline={multiline} textAlignVertical="top"
    style={[theme.textStyles.body, styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]} /></View>;
}

function ReviewSubjectField({ value, options, onCommit }: { value: string; options: { name: string; code: string }[]; onCommit: (value: string) => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return <View style={styles.field}><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginBottom: 6 }]}>Subject</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Subject: ${value || 'Choose subject'}`} onPress={() => { Keyboard.dismiss(); setOpen(true); }} style={[styles.input, { borderColor: theme.colors.border, backgroundColor: theme.colors.bg, flexDirection: 'row', alignItems: 'center', gap: 8 }]}><Text style={[theme.textStyles.body, { flex: 1, color: theme.colors.textPrimary }]}>{value || 'Choose subject'}</Text><Ionicons name="chevron-down" size={18} color={theme.colors.primary} /></TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 22 }}><View style={{ maxHeight: '75%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 18 }}><Text style={[theme.textStyles.h3, { color: theme.colors.textPrimary, marginBottom: 14 }]}>Choose subject</Text><ScrollView>{options.map(option => <TouchableOpacity key={option.code || option.name} accessibilityRole="button" onPress={() => { onCommit(option.name); setOpen(false); }} style={{ paddingVertical: 15, borderBottomWidth: 1, borderColor: theme.colors.borderLight }}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.textPrimary }]}>{option.name}</Text>{!!option.code && <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>{option.code}</Text>}</TouchableOpacity>)}{!options.length && <Text style={{ color: theme.colors.textSecondary }}>Add the missing course in Subjects first.</Text>}</ScrollView><TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: theme.colors.primary }}>Close</Text></TouchableOpacity></View></View></Modal>
  </View>;
}

function ReviewDateTimeField({ label, value, onCommit, onOpen }: { label: string; value: string; onCommit: (value: string) => void; onOpen: () => void }) {
  const theme = useTheme();
  const isTime = label.includes('HH:MM');
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(new Date());
  const pad = (n: number) => String(n).padStart(2, '0');
  const commit = () => {
    onCommit(isTime ? `${pad(selection.getHours())}:${pad(selection.getMinutes())}` : `${selection.getFullYear()}-${pad(selection.getMonth() + 1)}-${pad(selection.getDate())}`);
    setOpen(false);
  };
  const title = isTime ? label.replace(/ · HH:MM.*$/, ' time') : label;
  return <View style={styles.field}><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginBottom: 6 }]}>{title}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${title}: ${value || 'not set'}`} onPress={() => {
      Keyboard.dismiss(); onOpen();
      const next = new Date();
      if (isTime && /^\d{2}:\d{2}$/.test(value)) { const [hour, minute] = value.split(':').map(Number); next.setHours(hour, minute, 0, 0); }
      else if (!isTime && /^\d{4}-\d{2}-\d{2}$/.test(value)) { const [year, month, day] = value.split('-').map(Number); next.setFullYear(year, month - 1, day); }
      setSelection(next); setOpen(true);
    }} style={[styles.input, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
      <Text style={[theme.textStyles.body, { color: value ? theme.colors.textPrimary : theme.colors.textTertiary }]}>{value ? isTime && /^\d{2}:\d{2}$/.test(value) ? `${formatTime(value)} (${value})` : value : isTime ? 'Choose time · AM / PM' : 'Choose date (optional)'}</Text><Ionicons name={isTime ? 'time-outline' : 'calendar-outline'} size={20} color={theme.colors.primary} />
    </TouchableOpacity>
    {open && <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 22 }}><View style={{ backgroundColor: theme.colors.surface, borderRadius: 22, padding: 20, gap: 18 }}>
      <Text style={[theme.textStyles.h3, { color: theme.colors.textPrimary }]}>{title}</Text>
      {isTime && <Text style={[theme.textStyles.bodySemiBold, { color: theme.colors.primary }]}>{formatTime(`${pad(selection.getHours())}:${pad(selection.getMinutes())}`)}</Text>}
      <DateTimePicker value={selection} mode={isTime ? 'time' : 'date'} display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour={false} locale="en-US" themeVariant={theme.isDark ? 'dark' : 'light'} textColor={theme.colors.textPrimary} onValueChange={(_event, date) => { if (date) setSelection(date); }} onDismiss={() => setOpen(false)} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><TouchableOpacity onPress={() => setOpen(false)} style={styles.close}><Text style={{ color: theme.colors.textSecondary }}>Cancel</Text></TouchableOpacity><TouchableOpacity onPress={() => { onCommit(''); setOpen(false); }} style={styles.close}><Text style={{ color: theme.colors.textSecondary }}>Clear</Text></TouchableOpacity><TouchableOpacity onPress={commit} style={{ padding: 12, borderRadius: 12, backgroundColor: theme.colors.primary }}><Text style={{ color: '#fff', fontWeight: '600' }}>Use {isTime ? 'time' : 'date'}</Text></TouchableOpacity></View>
    </View></View></Modal>}
  </View>;
}

export function AcademicActionReview({ initial, onClose, onSaved, onDraftChange }: { onDraftChange?: (draft: AcademicActionDraft) => void; initial: AcademicActionDraft; onClose: () => void; onSaved: (summary: string) => void }) {
  const theme = useTheme();
  const [draft, setDraft] = useState(() => {
    try { return normalizeSubjectActions(initial, actionSnapshot(), initial.semester ?? useProfileStore.getState().profile?.currentSemester ?? 1); }
    catch { return initial; }
  });
  useEffect(() => { onDraftChange?.(draft); }, [draft]);
  const [semester, setSemester] = useState(String(initial.semester ?? useProfileStore.getState().profile?.currentSemester ?? 1));
  const [replace, setReplace] = useState(false);
  const [replaceDated, setReplaceDated] = useState(false);
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<AcademicActionDraft | null>(null);
  const validationDraft = editingSnapshot ?? draft;
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const toggleRow = (id: string) => setExpanded(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const gradeScheme = useAcademicStore(s => s.gradeScheme);
  const classIssues = classReviewIssues(validationDraft, actionSnapshot(), Number(semester), replace, replaceDated);
  const issueClasses = classIssues.filter(issues => issues.length > 0).length;
  const issueCount = classIssues.reduce((count, issues) => count + issues.length, 0);
  let summary: string[] = [];
  let problem = '';
  let snapshotSignature = '';
  try { const preview = previewAcademicActions(validationDraft, Number(semester), replace, replaceDated); summary = preview.summary; snapshotSignature = preview.snapshotSignature; }
  catch (error) { problem = error instanceof Error ? error.message : 'Review the proposed changes.'; }
  const edit = (section: Section, index: number, field: string, value: string) => {
    setSaveError('');
    const parsed = numeric.has(field) ? (value.trim() === '' ? null : Number(value)) : value;
    setDraft(prev => ({ ...prev, [section]: prev[section].map((row, i) => i === index ? { ...row, [field]: parsed, ...(section === 'classes' && field === 'subject' ? { sourceLabel: '', mappedFrom: '', mappingConfirmed: true } : {}) } : row) }));
  };
  const remove = (section: Section, index: number) => setDraft(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  const saved = actionSnapshot();
  const describeChange = (index: number) => {
    const change = draft.changes[index];
    const item = change.target === 'class' ? saved.entries.find(e => e.id === change.id) : change.target === 'assignment' ? saved.assignments.find(a => a.id === change.id) : change.target === 'exam' ? saved.exams.find(e => e.id === change.id) : null;
    const subjectId = change.target === 'subject' ? change.id : item?.subjectId;
    const subject = saved.subjects.find(s => s.id === subjectId);
    const name = change.target === 'calendar' ? change.id : subject?.name ?? change.target;
    const detail = item && 'title' in item ? item.title : item && 'startTime' in item ? `${'date' in item && item.date ? item.date : 'dayOfWeek' in item ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][item.dayOfWeek] : ''} ${item.startTime ?? ''}` : '';
    const field = change.field.replace(/([A-Z])/g, ' $1').toLowerCase();
    return `${change.operation === 'delete' ? 'Delete' : 'Update'} ${name} ${detail}${change.operation === 'update' ? ` · ${field}` : ''}`;
  };
  const longText = new Set(['Subject name', 'Subject name or code', 'Faculty (optional)', 'Description (optional)', 'Title', 'Notes', 'Syllabus', 'Attendance note', 'New value', 'Code (optional)']);
  const input = (label: string, value: string, onChangeText: (value: string) => void, number = false, rowKey?: string) => {
    if (/HH:MM|date|YYYY-MM-DD/i.test(label)) return <ReviewDateTimeField key={label} label={label} value={value} onCommit={onChangeText} onOpen={() => { if (rowKey) setExpanded(previous => new Set([...previous, rowKey])); }} />;
    return <ReviewTextField key={label} label={label} value={value} numeric={number} multiline={longText.has(label)} onCommit={onChangeText}
      onFocus={() => { setEditingSnapshot(draft); if (rowKey) setExpanded(previous => new Set([...previous, rowKey])); }} onBlur={() => setEditingSnapshot(null)} />;
  };
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.page, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { borderColor: theme.colors.border }]}>
        <View style={{ flex: 1 }}><Text style={[theme.textStyles.h3, { color: theme.colors.textPrimary }]}>Review app changes</Text><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>Nothing is saved until you confirm.</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancel proposed changes" onPress={onClose} style={styles.close}><Ionicons name="close" size={24} color={theme.colors.textPrimary} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!!draft.message && <Text style={[theme.textStyles.body, { color: theme.colors.textSecondary }]}>{draft.message}</Text>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{sections.filter(section => draft[section.key].length).map(section => <View key={section.key} style={{ backgroundColor: theme.colors.primaryLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={[theme.textStyles.smallMedium, { color: theme.colors.primary }]}>{draft[section.key].length} {section.title.toLowerCase()}</Text></View>)}</View>
        {input('Target semester', semester, setSemester, true)}
        {!!draft.subjects.length && <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary }]}>Tap an item to edit its details. Check names, faculty and subject types before saving.</Text>}
        {draft.reportedSgpa != null && !draft.results.length && <View style={styles.fields}>
          {input('Reported SGPA · 0–10', String(draft.reportedSgpa), value => setDraft(prev => ({ ...prev, reportedSgpa: value === '' ? null : Number(value) })), true)}
          {input('Total semester credits', String(draft.reportedCredits ?? ''), value => setDraft(prev => ({ ...prev, reportedCredits: value === '' ? null : Number(value) })), true)}
        </View>}
        {!!draft.results.length && <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary }]}>Grading: {gradeScheme.name}. Missing credits or grade points must be completed. Marks are normalized using the maximum marks you review. Existing results for other subjects are retained. SGPA is calculated by CampusIQ.</Text>}
        {!!draft.classes.length && <Text style={[theme.textStyles.smallMedium, { color: theme.colors.textSecondary }]}>{draft.classes.filter(entry => entry.type !== 'lab').length} lecture slots · {draft.classes.filter(entry => entry.type === 'lab').length} lab slots. Check section/batch and merged time blocks against your image.</Text>}
        {!!draft.classes.length && <View style={[styles.toggle, { backgroundColor: theme.colors.surface }]}><View style={{ flex: 1 }}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.textPrimary }]}>Replace timetable</Text><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 4 }]}>Replace the selected semester’s saved schedule with this import. Other semesters stay unchanged.</Text></View><Switch accessibilityLabel="Replace timetable for selected semester" value={replace} onValueChange={setReplace} /></View>}
        {replace && !!draft.classes.length && <SegmentedControl label="What should be replaced?" value={replaceDated ? 'all' : 'weekly'} onChange={value => setReplaceDated(value === 'all')} options={[{ label: 'Weekly only', value: 'weekly' }, { label: 'Weekly + dated', value: 'all' }]} />}
        {!!draft.classes.length && <View style={{ padding: 15, borderRadius: 16, backgroundColor: issueClasses ? theme.colors.primaryLight : theme.colors.surface, gap: 10 }}><Text accessibilityLiveRegion="polite" style={[theme.textStyles.bodySemiBold, { color: theme.colors.textPrimary }]}>{issueClasses ? `${issueClasses} of ${draft.classes.length} classes need attention · ${issueCount} issues` : `All ${draft.classes.length} classes checked for conflicts`}</Text><View style={{ flexDirection: 'row', gap: 8 }}>{[{ label: 'All classes', value: false }, { label: `Issues only (${issueClasses})`, value: true }].map(option => <TouchableOpacity key={option.label} accessibilityRole="button" accessibilityState={{ selected: issuesOnly === option.value }} onPress={() => setIssuesOnly(option.value)} style={{ borderRadius: 10, padding: 10, backgroundColor: issuesOnly === option.value ? theme.colors.primary : theme.colors.bg }}><Text style={[theme.textStyles.smallMedium, { color: issuesOnly === option.value ? '#fff' : theme.colors.textPrimary }]}>{option.label}</Text></TouchableOpacity>)}</View>{replace && <Text style={[theme.textStyles.small, { color: theme.colors.textSecondary }]}>{replaceDated ? 'All saved weekly and dated classes in this semester are excluded. Only conflicts within the import remain.' : 'Old weekly classes are excluded. Saved dated classes are retained; choose Weekly + dated to replace those too.'}</Text>}</View>}
        {sections.map(section => draft[section.key].length ? <View key={section.key} style={styles.section}>
          <Text style={[theme.textStyles.h3, { color: theme.colors.textPrimary }]}>{section.title} · {draft[section.key].length}</Text>
          {draft[section.key].map((row, index) => section.key === 'classes' && issuesOnly && !classIssues[index]?.length && !expanded.has(`${section.key}-${index}`) ? null : <View key={index} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {section.key === 'classes' && !!classIssues[index]?.length && <Text style={[theme.textStyles.smallMedium, { color: theme.colors.danger, marginBottom: 5 }]}>{classIssues[index].length} {classIssues[index].length === 1 ? 'issue' : 'issues'} to resolve</Text>}
            <View style={styles.rowHeader}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${section.title} item ${index + 1}`} accessibilityState={{ expanded: expanded.has(`${section.key}-${index}`) }} onPress={() => toggleRow(`${section.key}-${index}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 9 }}><Text style={[theme.textStyles.smallMedium, { color: theme.colors.textSecondary, flex: 1, marginRight: 8 }]}>{section.key === 'changes' ? describeChange(index) : section.key === 'subjects' ? `${draft.subjects[index].id ? 'Update' : 'Add'} · ${draft.subjects[index].name || 'Unnamed subject'}` : section.key === 'classes' ? `Class ${index + 1} · ${draft.classes[index].subject || 'Choose subject'} · ${draft.classes[index].date || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][draft.classes[index].day ?? -1] || 'Choose day'} · ${draft.classes[index].start || '?'}–${draft.classes[index].end || '?'}` : `Item ${index + 1}`}</Text><Ionicons name={expanded.has(`${section.key}-${index}`) ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textSecondary} /></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${section.title} item ${index + 1}`} onPress={() => remove(section.key, index)} style={styles.close}><Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} /></TouchableOpacity></View>
            {(expanded.has(`${section.key}-${index}`) || (section.key === 'classes' && !!classIssues[index]?.length)) && <>
            {section.key === 'changes' && draft.changes[index].target === 'subject' && !saved.subjects.some(subject => subject.id === draft.changes[index].id) && <View style={{ gap: 8, marginBottom: 12 }}>
              <Text style={[theme.textStyles.small, { color: theme.colors.textPrimary }]}>Choose the subject this change belongs to:</Text>
              {saved.subjects.filter(subject => subject.semesterId === semester).map(subject => <TouchableOpacity key={subject.id} accessibilityRole="button" onPress={() => setDraft(prev => {
                const next = { ...prev, changes: prev.changes.map((change, i) => i === index ? { ...change, id: subject.id } : change) };
                try { return normalizeSubjectActions(next, actionSnapshot(), Number(semester)); } catch { return next; }
              })} style={[styles.secondaryButton, { borderColor: theme.colors.border }]}><Text style={[theme.textStyles.small, { color: theme.colors.textPrimary }]}>{subject.name}{subject.code ? ` (${subject.code})` : ''}</Text></TouchableOpacity>)}
            </View>}
            {section.key === 'classes' && draft.classes[index].mappedFrom && !draft.classes[index].mappingConfirmed && <View style={{ padding: 14, borderRadius: 14, backgroundColor: theme.colors.primaryLight, marginBottom: 12, gap: 10 }}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.textPrimary }]}>Map “{draft.classes[index].mappedFrom}” to “{draft.classes[index].subject}”?</Text><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary }]}>This looks like the practical part of this course. Confirm, or edit the subject below to choose another course.</Text><TouchableOpacity accessibilityRole="button" onPress={() => setDraft(prev => ({ ...prev, classes: prev.classes.map(entry => entry.mappedFrom === prev.classes[index].mappedFrom && entry.subject === prev.classes[index].subject ? { ...entry, mappingConfirmed: true } : entry) }))} style={{ backgroundColor: theme.colors.primary, padding: 12, borderRadius: 10, alignItems: 'center' }}><Text style={{ color: '#fff', fontWeight: '600' }}>Confirm for matching lab classes</Text></TouchableOpacity></View>}
            {section.key === 'classes' && classIssues[index]?.map((issue, i) => <Text key={i} accessibilityRole="alert" style={[theme.textStyles.small, { color: theme.colors.danger, backgroundColor: theme.colors.bg, borderRadius: 10, padding: 10, marginBottom: 8 }]}>{issue}</Text>)}
            <View style={styles.fields}>{(section.key === 'changes' && draft.changes[index].operation === 'delete' ? [] : section.fields).map(([field, label]) => {
              const value = String((row as unknown as Record<string, unknown>)[field] ?? '');
              const update = (next: string) => edit(section.key, index, field, next);
              if (section.key === 'classes' && field === 'subject') {
                const options = [...saved.subjects.filter(subject => subject.semesterId === semester), ...draft.subjects].filter(subject => subject.name).filter((subject, index, all) => all.findIndex(candidate => candidate.name.toLowerCase() === subject.name.toLowerCase()) === index).sort((a, b) => a.name.localeCompare(b.name));
                return <ReviewSubjectField key={field} value={value} options={options} onCommit={update} />;
              }
              if (section.key === 'classes' && field === 'day') return <View key={field} style={{ width: '100%', gap: 8 }}><Text style={[theme.textStyles.small, { color: theme.colors.textSecondary }]}>Day</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => <TouchableOpacity key={day} accessibilityRole="button" accessibilityState={{ selected: value === String(dayIndex) }} onPress={() => update(String(dayIndex))} style={{ paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: value === String(dayIndex) ? theme.colors.primary : theme.colors.bg }}><Text style={[theme.textStyles.smallMedium, { color: value === String(dayIndex) ? '#fff' : theme.colors.textPrimary }]}>{day}</Text></TouchableOpacity>)}</View></View>;
              if (section.key === 'classes' && field === 'type') return <SegmentedControl key={field} label="Class type" value={value} onChange={update} options={[{ label: 'Lecture', value: 'lecture' }, { label: 'Lab', value: 'lab' }]} />;
              if (field === 'color') return <ColorPicker key={field} label={label} value={value || '#3B82F6'} onChange={update} />;
              if (section.key === 'subjects' && field === 'icon') return <IconPicker key={field} label={label} value={value || 'book-outline'} selectedColor={draft.subjects[index].color || theme.colors.primary} onChange={update} />;
              if (section.key === 'subjects' && field === 'type') return <SegmentedControl key={field} label={label} value={value} onChange={update} options={[{ label: 'Theory Only', value: 'theory' }, { label: 'Theory + Practical', value: 'lab' }]} />;
              if (field === 'priority') return <SegmentedControl key={field} label={label} value={value || 'medium'} onChange={update} options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]} />;
              return input(label, value, update, numeric.has(field), `${section.key}-${index}`);
            })}</View>
            </>}
          </View>)}
        </View> : null)}
        <TouchableOpacity accessibilityRole="button" onPress={() => setDraft(prev => ({ ...prev, subjects: [...prev.subjects, { name: '', code: '', faculty: '', description: '', room: '', shortName: '', type: '', color: '', icon: '', credits: null }] }))} style={[styles.secondaryButton, { borderColor: theme.colors.border }]}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.primary }]}>Add a missing subject</Text></TouchableOpacity>
        {!!draft.classes.length && <TouchableOpacity accessibilityRole="button" onPress={() => setDraft(prev => ({ ...prev, classes: [...prev.classes, { subject: '', day: null, date: '', start: '', end: '', room: '', color: '', type: '' }] }))} style={[styles.secondaryButton, { borderColor: theme.colors.border }]}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.primary }]}>Add a missing class</Text></TouchableOpacity>}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[theme.textStyles.bodySemiBold, { color: theme.colors.textPrimary }]}>What will change</Text>{summary.map((line, i) => <Text key={i} style={[theme.textStyles.small, { color: theme.colors.textSecondary, marginTop: 8 }]}>{line}</Text>)}</View>
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {!!editingSnapshot && <TouchableOpacity accessibilityRole="button" onPress={Keyboard.dismiss} style={{ alignSelf: 'flex-end', padding: 10, marginBottom: 4 }}><Text style={[theme.textStyles.bodyMedium, { color: theme.colors.primary }]}>Done editing ↓</Text></TouchableOpacity>}
        {!!problem && <Text accessibilityRole="alert" style={[theme.textStyles.small, { color: theme.colors.textPrimary, marginBottom: 10 }]}>{problem}</Text>}
        {!!saveError && <Text style={[theme.textStyles.small, { color: theme.colors.textPrimary, marginBottom: 10 }]}>{saveError}</Text>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Confirm and save app changes" disabled={!!problem || saving || !!editingSnapshot} style={[styles.primaryButton, { backgroundColor: theme.colors.primary, opacity: problem || saving || editingSnapshot ? 0.45 : 1 }]} onPress={() => {
          if (saving || problem || editingSnapshot) return;
          setSaving(true);
          try { onSaved(applyAcademicActions(draft, Number(semester), replace, snapshotSignature, replaceDated)); }
          catch (error) { setSaveError(error instanceof Error ? error.message : 'Could not save changes.'); setSaving(false); }
        }}><Text style={[theme.textStyles.bodySemiBold, { color: '#fff' }]}>{saving ? 'Saving…' : 'Confirm and save'}</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: Platform.OS === 'ios' ? 16 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  close: { padding: 8 }, content: { padding: 20, gap: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { gap: 12 }, card: { padding: 14, borderWidth: 1, borderRadius: 20 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  fields: { gap: 12 }, field: { width: '100%', minWidth: 0 },
  input: { minHeight: 44, padding: 10, borderWidth: 1, borderRadius: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, borderTopWidth: 1 },
  primaryButton: { padding: 14, borderRadius: 12, alignItems: 'center' },
  secondaryButton: { padding: 12, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
});
