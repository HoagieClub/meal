import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import DiningHallCard from "../components/DiningHallCard";
import { DUMMY_DINING_HALL } from "../data/dummyMenu";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
        stroke="#9ca3af"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M7 12h10M10 18h4" stroke="#374151" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronLeftIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HoagieLogoSvg() {
  return (
    <Svg width={69} height={22} fill="none">
      <Path
        d="M57.647 20.724c5.232 0 9.474-4.242 9.474-9.474s-4.241-9.474-9.474-9.474H39.66L25.375 20.724h32.272z"
        fill="#008001"
      />
      <Path
        d="M25.375 20.724h32.272c5.232 0 9.474-4.242 9.474-9.474h0c0-5.232-4.241-9.474-9.474-9.474H39.66M25.375 20.724H10.752c-5.232 0-9.474-4.242-9.474-9.474h0c0-5.232 4.242-9.474 9.474-9.474h8.024m6.6 18.948L39.66 1.777m0 0H28.112m0 0l-7.53 9.581m7.53-9.581h-9.337m0 0l-6.534 8.645"
        stroke="#212121"
        strokeWidth={2.482}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Data & Helpers ───────────────────────────────────────────────────────────

const MEAL_COLORS: Record<string, string> = {
  Breakfast: "#e8f5ee",
  Lunch: "#d5eddf",
  Dinner: "#c2e5d0",
};

const MEAL_RANGES: Record<string, string> = {
  Breakfast: "7:30 – 10:30 AM",
  Lunch: "11:30 AM – 2:00 PM",
  Dinner: "5:00 – 8:00 PM",
  Brunch: "10:00 AM – 2:00 PM",
};

const getToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getCurrentMeal = (): string => {
  const h = new Date().getHours();
  if (h < 11) return "Breakfast";
  if (h < 17) return "Lunch";
  return "Dinner";
};

const isWeekend = (d: Date): boolean => [0, 6].includes(d.getDay());

const getNext7Days = (): Date[] => {
  const today = getToday();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDateLabel = (d: Date): string =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

const formatDayAbbrev = (d: Date): string =>
  d.toLocaleDateString("en-US", { weekday: "short" });

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const [meal, setMeal] = useState<string>(getCurrentMeal());
  const [locationType, setLocationType] = useState<"residential" | "retail">("residential");
  const [searchTerm, setSearchTerm] = useState("");

  const isWeekendDay = isWeekend(selectedDate);
  const meals = isWeekendDay ? ["Lunch", "Dinner"] : ["Breakfast", "Lunch", "Dinner"];
  const mealColor = MEAL_COLORS[meal] ?? "#c2e5d0";
  const next7Days = getNext7Days();

  const displayedMeal =
    locationType === "retail" ? "Retail" : meal === "Lunch" && isWeekendDay ? "Brunch" : meal;
  const hours =
    locationType === "retail" ? "Hours vary by location" : MEAL_RANGES[displayedMeal] ?? MEAL_RANGES[meal];

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
    if (isWeekend(d) && meal === "Breakfast") setMeal("Lunch");
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top accent bar ── */}
      <View style={styles.topBar} />

      {/* ── Nav ── */}
      <View style={styles.nav}>
        <View style={styles.logoRow}>
          <Text style={styles.logoHoagie}>hoagie</Text>
          <Text style={styles.logoMeal}>meal</Text>
          <Text style={styles.logoBeta}> BETA</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} activeOpacity={0.7}>
          <Text style={styles.navLink}>Login</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.navDivider} />

      {/* ── Sticky search bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrap}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a dish..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <FilterIcon />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── Context band: location + meal ── */}
        <View style={[styles.contextBand, { backgroundColor: mealColor }]}>

          {/* Location toggle */}
          <View style={styles.segmentedControl}>
            {(["residential", "retail"] as const).map((type) => {
              const label = type === "residential" ? "Dining Halls" : "Retail";
              const active = locationType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  onPress={() => setLocationType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Meal toggle (residential only) */}
          {locationType === "residential" && (
            <View style={styles.mealPill}>
              {meals.map((m) => {
                const active = meal === m;
                const label = isWeekendDay && m === "Lunch" ? "Brunch" : m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.mealOption, active && styles.mealOptionActive]}
                    onPress={() => setMeal(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.mealOptionText, active && styles.mealOptionTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Hours */}
          <Text style={styles.hoursText}>{hours}</Text>
        </View>

        {/* ── Date strip ── */}
        <View style={styles.dateStrip}>

          {/* Date nav row */}
          <View style={styles.dateNavRow}>
            <TouchableOpacity style={styles.chevronBtn} onPress={() => shiftDay(-1)} activeOpacity={0.7}>
              <ChevronLeftIcon />
            </TouchableOpacity>
            <Text style={styles.dateLabel} numberOfLines={1}>
              {formatDateLabel(selectedDate)}
            </Text>
            <TouchableOpacity style={styles.chevronBtn} onPress={() => shiftDay(1)} activeOpacity={0.7}>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>

          {/* Day chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayChipsRow}
          >
            {next7Days.map((date) => {
              const selected = isSameDay(date, selectedDate);
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipAbbrev, selected && styles.dayChipTextSelected]}>
                    {formatDayAbbrev(date)}
                  </Text>
                  <Text style={[styles.dayChipNum, selected && styles.dayChipTextSelected]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Cards ── */}
        <View style={styles.cardsSection}>
          <DiningHallCard hall={DUMMY_DINING_HALL} />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <HoagieLogoSvg />
          <Text style={styles.footerText}>
            {"  "}Made by <Text style={styles.bold}>Hoagie Club.</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // ── Top bar ──
  topBar: {
    height: 6,
    backgroundColor: "#008001",
  },

  // ── Nav ──
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoHoagie: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#000000",
  },
  logoMeal: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#008001",
  },
  logoBeta: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#052e16",
    letterSpacing: 1,
  },
  navLink: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6b7280",
  },
  navDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },

  // ── Search ──
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
    backgroundColor: "#f7f8f9",
  },

  // ── Context band ──
  contextBand: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(22,101,52,0.65)",
  },
  segmentTextActive: {
    color: "#166534",
  },
  mealPill: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    padding: 3,
  },
  mealOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  mealOptionActive: {
    backgroundColor: "#166534",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  mealOptionText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "rgba(22,101,52,0.65)",
  },
  mealOptionTextActive: {
    color: "#ffffff",
  },
  hoursText: {
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#15803d",
    marginTop: -4,
  },

  // ── Date strip ──
  dateStrip: {
    backgroundColor: "#ffffff",
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#111827",
  },
  dayChipsRow: {
    paddingHorizontal: 16,
    gap: 6,
  },
  dayChip: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    minWidth: 46,
  },
  dayChipSelected: {
    backgroundColor: "#166534",
  },
  dayChipAbbrev: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6b7280",
  },
  dayChipNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#111827",
  },
  dayChipTextSelected: {
    color: "#ffffff",
  },

  // ── Cards ──
  cardsSection: {
    paddingBottom: 8,
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 32,
    paddingBottom: 24,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6b7280",
  },
  bold: {
    fontFamily: "Poppins_700Bold",
  },
});
