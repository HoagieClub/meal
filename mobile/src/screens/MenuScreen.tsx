import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import Svg, { Path, Circle, Line } from "react-native-svg";
import DiningHallCard from "../components/DiningHallCard";
import { DUMMY_DINING_HALL } from "../data/dummyMenu";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

function DhallIcon() {
  return (
    <Svg width={16} height={14} viewBox="0 0 51 45" fill="none">
      <Path
        d="M33.9137 4.8308C29.6549 9.08961 29.2988 13.7338 30.6465 16.7898C30.7717 17.0719 30.7498 17.4179 30.4729 17.6628L8.06315 37.5755C6.16661 39.2608 6.25368 41.2663 8.10922 43.1219C9.96476 44.978 11.9697 45.0639 13.6545 43.1679L33.5683 20.7571C33.8143 20.4813 34.1587 20.4599 34.4418 20.5841C37.4973 21.9306 42.1409 21.5745 46.4003 17.3162C50.9001 12.817 51.9877 6.24816 48.485 2.74493C44.9813 -0.757726 38.4136 0.331553 33.9137 4.8308Z"
        fill="white"
      />
      <Path
        d="M16.5232 20.3358C16.7816 20.1678 17.1058 20.1554 17.3513 20.4318L20.5068 23.9783L24.1976 20.6992L20.4365 17.3528C20.1607 17.1067 20.1725 16.7826 20.341 16.5247C22.3314 13.4703 21.2657 10.2845 18.4108 7.88686L9.25331 0.378756C8.65446 -0.108302 8.05561 -0.143694 7.53372 0.378194C7.01015 0.901767 7.01127 1.57702 7.53316 2.09891L15.1115 9.67555C15.6632 10.2283 15.6632 10.9395 15.1115 11.4912L15.0699 11.5333C14.5183 12.0844 13.8059 12.0844 13.2537 11.5333L5.6765 3.95557C5.15405 3.43368 4.4788 3.43312 3.95579 3.95613C3.43277 4.47914 3.43334 5.1544 3.95635 5.67572L11.533 13.2541C12.0858 13.8063 12.0858 14.518 11.533 15.0691L11.4925 15.1113C10.9409 15.6624 10.2286 15.6624 9.67633 15.1107L2.09856 7.53295C1.57611 7.01106 0.900858 7.00994 0.378408 7.53295C-0.144041 8.0554 -0.108088 8.65369 0.37897 9.25254L7.88708 18.41C10.2853 21.2655 13.4689 22.3267 16.5232 20.3358Z"
        fill="white"
      />
      <Path
        d="M43.1691 37.5794L30.878 26.6428L26.8799 31.1421L37.58 43.168C39.2642 45.064 41.268 44.9752 43.1225 43.1208C44.9774 41.2692 45.0639 39.2642 43.1691 37.5794Z"
        fill="white"
      />
    </Svg>
  );
}

function RetailIcon() {
  return (
    <Svg width={11} height={14} viewBox="0 0 34 45" fill="none">
      <Path
        d="M33.9976 12.2161L0 12.0631L0.642116 7.90985L4.52116 7.69239L4.84341 4.16764L21.0884 2.88675L25.5951 0H29.5366L30.1186 7.72096L34 8.52389V12.216L33.9976 12.2161ZM27.9903 45L31.3475 13.9773L2.99652 14.0108L5.86307 44.9998L27.9903 45Z"
        fill="white"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
        stroke="#808080"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M7 12h10M10 18h4" stroke="#166534" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronLeft() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke="#166534" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke="#166534" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

const MEAL_COLORS: Record<string, string> = {
  Breakfast: "#ebf7f2",
  Lunch: "#daefe8",
  Dinner: "#cae6dc",
};

const MEAL_RANGES: Record<string, string> = {
  Breakfast: "7:30 AM - 10:30 AM",
  Lunch: "11:30 AM - 2:00 PM",
  Dinner: "5:00 PM - 8:00 PM",
  Brunch: "10:00 AM - 2:00 PM",
};

const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getCurrentMeal = (): string => {
  const hour = new Date().getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 17) return "Lunch";
  return "Dinner";
};

const isWeekend = (date: Date): boolean => [0, 6].includes(date.getDay());

const getNext7Days = (): Date[] => {
  const today = getToday();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

const formatDayAbbrev = (date: Date): string => date.toLocaleDateString("en-US", { weekday: "short" });

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(getToday());
  const [meal, setMeal] = useState<string>(getCurrentMeal());
  const [locationType, setLocationType] = useState<"residential" | "retail">("residential");
  const [searchTerm, setSearchTerm] = useState("");

  const isWeekendDay = isWeekend(selectedDate);
  const meals = isWeekendDay ? ["Lunch", "Dinner"] : ["Breakfast", "Lunch", "Dinner"];
  const mealColor = MEAL_COLORS[meal] ?? "#cae6dc";
  const next7Days = getNext7Days();

  const displayedMeal = locationType === "retail" ? "Retail" : meal === "Lunch" && isWeekendDay ? "Brunch" : meal;
  const mealHours = locationType === "retail" ? "Hours vary" : MEAL_RANGES[displayedMeal] ?? MEAL_RANGES[meal];

  const goToPreviousDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    if (isWeekend(d) && meal === "Breakfast") setMeal("Lunch");
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    if (isWeekend(d) && meal === "Breakfast") setMeal("Lunch");
  };

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar} />
      <View style={styles.nav}>
        <View style={styles.logoRow}>
          <Text style={styles.logoHoagie}>hoagie</Text>
          <Text style={styles.logoMeal}>meal</Text>
          <Text style={styles.logoBeta}> BETA</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Text style={styles.navLink}>Login</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.navDivider} />

      <View style={[styles.searchBar, { backgroundColor: mealColor }]}>
        <View style={styles.locationToggle}>
          <TouchableOpacity
            style={[styles.locationBtn, locationType === "residential" && styles.locationBtnActive]}
            onPress={() => setLocationType("residential")}>
            <DhallIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.locationBtn, locationType === "retail" && styles.locationBtnActive]}
            onPress={() => setLocationType("retail")}>
            <RetailIcon />
          </TouchableOpacity>
        </View>

        <View style={styles.searchInputWrapper}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food..."
            placeholderTextColor="#808080"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <FilterIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ backgroundColor: mealColor }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.mealTitleSection}>
          <Text style={styles.mealTitle}>{displayedMeal}</Text>
          <Text style={styles.mealHours}>{mealHours}</Text>
        </View>

        <View style={styles.dateSelectorSection}>
          <View style={styles.dateNavRow}>
            <TouchableOpacity style={styles.arrowBtn} onPress={goToPreviousDay}>
              <ChevronLeft />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity style={styles.arrowBtn} onPress={goToNextDay}>
              <ChevronRight />
            </TouchableOpacity>
          </View>

          <View style={styles.dayTabsRow}>
            {next7Days.map((date) => {
              const selected = isSameDay(date, selectedDate);
              return (
                <TouchableOpacity key={date.toISOString()} onPress={() => setSelectedDate(date)}>
                  <Text style={[styles.dayTab, selected && styles.dayTabSelected]}>{formatDayAbbrev(date)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {locationType === "residential" && (
            <View style={styles.mealToggle}>
              {meals.map((m) => {
                const isSelected = meal === m;
                const label = isWeekendDay && m === "Lunch" ? "Brunch" : m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.mealToggleOption, isSelected && styles.mealToggleOptionActive]}
                    onPress={() => setMeal(m)}>
                    <Text style={[styles.mealToggleText, isSelected && styles.mealToggleTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <DiningHallCard hall={DUMMY_DINING_HALL} />

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topBar: {
    height: 6,
    backgroundColor: "#008001",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    color: "#808080",
  },
  navDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 12,
    gap: 12,
  },
  locationToggle: {
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#a3d4b8",
  },
  locationBtn: {
    padding: 8,
  },
  locationBtnActive: {
    backgroundColor: "#166534",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#343434",
    padding: 0,
  },
  filterBtn: {
    padding: 6,
    borderRadius: 10,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mealTitleSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  mealTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    marginBottom: -12,
    color: "#166534",
    textAlign: "center",
  },
  mealHours: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#15803d",
    textAlign: "center",
  },
  dateSelectorSection: {
    marginHorizontal: 8,
    marginTop: 12,
    gap: 8,
  },
  dateNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "#166534",
    width: 220,
    textAlign: "center",
  },
  dayTabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 4,
  },
  dayTab: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#166534",
  },
  dayTabSelected: {
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
  mealToggle: {
    flexDirection: "row",
    borderRadius: 999,
    backgroundColor: "#f0fdf4",
    overflow: "hidden",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mealToggleOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 999,
  },
  mealToggleOptionActive: {
    backgroundColor: "#166534",
  },
  mealToggleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#14532d",
  },
  mealToggleTextActive: {
    color: "#ffffff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#343434",
  },
  bold: {
    fontFamily: "Poppins_700Bold",
  },
});
