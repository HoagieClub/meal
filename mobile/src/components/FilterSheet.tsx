import { Modal, View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

// ─── Data ─────────────────────────────────────────────────────────────────────

export const MENU_SORT_OPTIONS = ["Category", "Most Liked", "Favorited"] as const;
export type MenuSortOption = (typeof MENU_SORT_OPTIONS)[number];

export const ALL_HALLS = [
  "Yeh / NCW",
  "Rocky / Mathey",
  "Whitman / Butler",
  "Forbes",
  "CJL",
  "Grad",
  "Cafe Vivian",
  "Wu Hall",
  "Frist Campus Center",
];

export const ALL_ALLERGENS = [
  "Peanut",
  "Tree Nut",
  "Coconut",
  "Eggs",
  "Milk",
  "Wheat",
  "Soybeans",
  "Crustacean",
  "Fish",
  "Sesame",
  "Alcohol",
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke="#ffffff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UndoIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9H16.5a5.5 5.5 0 010 11H8"
        stroke="#374151"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 5L3 9l4 4" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── CheckBox ─────────────────────────────────────────────────────────────────

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <CheckIcon />}
    </View>
  );
}

// ─── FilterRow ────────────────────────────────────────────────────────────────

function FilterRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <CheckBox checked={checked} />
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── FilterSheet ──────────────────────────────────────────────────────────────

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  sortOption: MenuSortOption;
  setSortOption: (v: MenuSortOption) => void;
  selectedHalls: string[];
  toggleHall: (hall: string) => void;
  excludedAllergens: string[];
  toggleAllergen: (allergen: string) => void;
  allergensEnabled: boolean;
  setAllergensEnabled: (v: boolean) => void;
  onReset: () => void;
}

export default function FilterSheet({
  visible,
  onClose,
  sortOption,
  setSortOption,
  selectedHalls,
  toggleHall,
  excludedAllergens,
  toggleAllergen,
  allergensEnabled,
  setAllergensEnabled,
  onReset,
}: FilterSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop — tap to dismiss */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        {/* Sheet */}
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.7}>
              <UndoIcon />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ── Sort / Filter ── */}
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort by</Text>
              <View style={styles.sortChips}>
                {MENU_SORT_OPTIONS.map((opt) => {
                  const active = sortOption === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.sortChip, active && styles.sortChipActive]}
                      onPress={() => setSortOption(opt)}
                      activeOpacity={0.7}>
                      <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={styles.sectionDivider} />

            {/* ── Dining Halls ── */}
            <Text style={styles.sectionTitle}>Dining Halls</Text>
            {ALL_HALLS.map((hall) => (
              <FilterRow
                key={hall}
                label={hall}
                checked={selectedHalls.includes(hall)}
                onPress={() => toggleHall(hall)}
              />
            ))}

            {/* ── Divider ── */}
            <View style={styles.sectionDivider} />

            {/* ── Allergen Tags ── */}
            <View style={styles.allergenTitleRow}>
              <Text style={styles.sectionTitle}>Allergen Tags</Text>
              <Switch
                value={allergensEnabled}
                onValueChange={setAllergensEnabled}
                trackColor={{ false: "#D1D5DB", true: "#166534" }}
                thumbColor="#ffffff"
                ios_backgroundColor="#D1D5DB"
              />
            </View>
            <Text style={styles.allergenSubtitle}>Exclude items containing:</Text>
            {ALL_ALLERGENS.map((allergen) => (
              <FilterRow
                key={allergen}
                label={allergen}
                checked={excludedAllergens.includes(allergen)}
                onPress={() => toggleAllergen(allergen)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Overlay (full screen, semi-transparent) ──
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },

  // ── Sheet (60% height, rounded top corners) ──
  sheet: {
    height: "62%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },

  // ── Drag handle ──
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13.5,
    color: "#374151",
  },
  // ── Scroll content ──
  scrollContent: {
    paddingBottom: 36,
  },

  // ── Section title ──
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13.5,
    color: "#111827",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },

  // ── Divider between sections ──
  sectionDivider: {
    height: 1,
    backgroundColor: "#E9E9E9",
    marginHorizontal: 20,
    marginTop: 8,
  },

  // ── Allergen header row ──
  allergenTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  allergenSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#9ca3af",
    paddingHorizontal: 20,
    marginBottom: 2,
  },

  // ── Filter row ──
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 11,
    gap: 14,
  },

  // ── Checkbox ──
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: "#166534",
    backgroundColor: "#166534",
  },

  // ── Row label ──
  rowLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14.5,
    color: "#111827",
  },

  // ── Sort row ──
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sortLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13.5,
    color: "#111827",
  },
  sortChips: {
    flexDirection: "row",
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#ffffff",
  },
  sortChipActive: {
    borderColor: "#166534",
    backgroundColor: "#166534",
  },
  sortChipText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12.5,
    color: "#374151",
  },
  sortChipTextActive: {
    color: "#ffffff",
    fontFamily: "Poppins_600SemiBold",
  },
});
