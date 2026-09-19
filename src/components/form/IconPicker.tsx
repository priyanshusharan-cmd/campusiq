import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const DEFAULT_ICONS: IoniconName[] = [
  // Academic & Subjects
  'book', 'library', 'planet', 'flask', 'beaker', 'earth', 'extension-puzzle', 'school', 'calculator', 'language', 'leaf',
  // Technology
  'code-slash', 'hardware-chip', 'server', 'settings', 'phone-portrait', 'laptop', 'desktop', 'wifi', 'game-controller', 'bug', 'terminal',
  // Finance & Business
  'trending-up', 'briefcase', 'bar-chart', 'pie-chart', 'cash', 'card', 'wallet', 'business',
  // Arts & Design
  'color-palette', 'brush', 'color-wand', 'camera', 'musical-notes', 'image',
  // Sports & Activities
  'bicycle', 'football', 'basketball', 'fitness', 'tennisball', 'walk',
  // General & Tools
  'shield-checkmark', 'bulb', 'compass', 'construct', 'hammer', 'key', 'magnet', 'map', 'megaphone', 'mic', 'paper-plane', 'pin', 'rocket', 'star', 'timer', 'trophy'
];

interface IconPickerProps {
  label?: string;
  icons?: IoniconName[];
  value: string;
  onChange: (icon: string) => void;
  selectedColor: string;
}

export function IconPicker({ label = 'Icon', icons = DEFAULT_ICONS, value, onChange, selectedColor }: IconPickerProps) {
  const { colors: themeColors, textStyles } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[textStyles.smallMedium, { color: themeColors.textPrimary, marginBottom: 12 }]}>{label}</Text>
      
      {/* Selected Icon Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.selectedButton,
          { 
            backgroundColor: themeColors.surface, 
            borderColor: themeColors.borderLight,
            opacity: pressed ? 0.8 : 1
          }
        ]} 
        onPress={() => setModalVisible(true)}
      >
        <View style={[styles.iconPreview, { backgroundColor: selectedColor + '15' }]}>
          <Ionicons name={value as any} size={22} color={selectedColor} />
        </View>
        <Text style={[textStyles.bodyMedium, { color: themeColors.textPrimary, marginLeft: 12, flex: 1 }]}>
          Change Icon
        </Text>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textTertiary} />
        </View>
      </Pressable>

      {/* Modal Popup */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg }]}>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom']}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.borderLight }]}>
                <Text style={[textStyles.h3, { color: themeColors.textPrimary }]}>Choose an Icon</Text>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.iconsRow}>
                  {icons.map((icon) => {
                    const isSelected = value === icon;
                    return (
                      <Pressable
                        key={icon}
                        onPress={() => {
                          onChange(icon);
                          setModalVisible(false);
                        }}
                        style={[
                          styles.iconOuter,
                          { backgroundColor: themeColors.surface },
                          isSelected && { borderColor: selectedColor, backgroundColor: selectedColor + '20' }
                        ]}
                      >
                        <Ionicons name={icon} size={24} color={isSelected ? selectedColor : themeColors.textSecondary} />
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  selectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6', // Or themeColors.bgSecondary
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%', // Modal takes up 70% of screen height
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  iconOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
