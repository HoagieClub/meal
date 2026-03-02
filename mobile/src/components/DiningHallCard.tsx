import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { DiningHallData, MenuItem } from "../data/dummyMenu";
import { MenuSection } from "./MenuSection";

// ─── Icons ────────────────────────────────────────────────────────────────────

function PinIcon({ pinned }: { pinned: boolean }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill={pinned ? "#166534" : "none"}>
      <Path
        d="M12 2l2.4 4.87 5.4.78-3.9 3.8.92 5.35L12 14.27l-4.82 2.53.92-5.35L4.2 7.65l5.4-.78L12 2z"
        stroke={pinned ? "#166534" : "#808080"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── DiningHallCard ───────────────────────────────────────────────────────────

export default function DiningHallCard({ hall }: { hall: DiningHallData }) {
  const [pinned, setPinned] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories: string[] = [];
  const grouped: Record<string, MenuItem[]> = {};
  for (const item of hall.menu) {
    if (!grouped[item.category]) {
      categories.push(item.category);
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hallName}>{hall.displayName}</Text>
          <TouchableOpacity onPress={() => setPinned((p) => !p)} activeOpacity={0.7} style={styles.pinBtn}>
            <PinIcon pinned={pinned} />
          </TouchableOpacity>
        </View>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{hall.displayName[0]}</Text>
        </View>
      </View>
      {categories.map((cat) => (
        <MenuSection
          key={cat}
          category={cat}
          items={grouped[cat]}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingLeft: 14,
    paddingRight: 0,
    paddingVertical: 10,
    overflow: "hidden",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hallName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#111827",
  },
  pinBtn: {
    padding: 2,
  },
  banner: {
    width: 72,
    height: 52,
    backgroundColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    marginRight: 8,
  },
  bannerText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#166534",
  },
});
