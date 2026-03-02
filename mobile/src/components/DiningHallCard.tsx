import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { DiningHallData, MenuItem, Nutrition } from "../data/dummyMenu";

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

function HeartIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke="#aaaaaa"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ThumbUpIcon({ active }: { active: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
        stroke={active ? "#166534" : "#888"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
        stroke={active ? "#166534" : "#888"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ThumbDownIcon({ active }: { active: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"
        stroke={active ? "#b91c1c" : "#888"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"
        stroke={active ? "#b91c1c" : "#888"}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ expanded }: { expanded: boolean }) {
  return (
    <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M6 9l6 6 6-6" stroke="#9ca3af" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// ─── Nutrition helpers ────────────────────────────────────────────────────────

type NutrientType = "limit" | "good" | "neutral";

function calcDV(amount: number | null | undefined, dv: number): number | null {
  if (amount == null || amount === 0) return null;
  return Math.round((amount / dv) * 100);
}

function rdvBarColor(rdvPercent: number | null, type: NutrientType): string {
  if (rdvPercent == null || type === "neutral") return "#C9C9C9";
  if (type === "good") return "#8BCF95";
  if (rdvPercent < 15) return "#8BCF95";
  if (rdvPercent <= 40) return "#F6C77D";
  return "#FF8989";
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "–";
  return parseFloat(n.toFixed(1)).toString();
}

// ─── NutrientCell ─────────────────────────────────────────────────────────────

function NutrientCell({
  label,
  amount,
  unit,
  rdvPercent,
  type = "neutral",
  style,
}: {
  label: string;
  amount: number | null | undefined;
  unit: string;
  rdvPercent: number | null;
  type?: NutrientType;
  style?: any;
}) {
  const barColor = rdvBarColor(rdvPercent, type);
  const displayValue = amount != null ? `${fmt(amount)} ${unit}` : "–";

  return (
    <View style={[styles.ncCell, style]}>
      <Text style={styles.ncLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.ncValue}>{displayValue}</Text>
      {rdvPercent != null && (
        <View style={styles.ncRdvRow}>
          <Text style={styles.ncRdvText}>{rdvPercent}%</Text>
          <View style={[styles.ncRdvBar, { backgroundColor: barColor }]} />
          <Text style={styles.ncRdvText}>RDV</Text>
        </View>
      )}
    </View>
  );
}

// ─── ServingCalories ──────────────────────────────────────────────────────────

function ServingCalories({
  servingSize,
  servingUnit,
  calories,
}: {
  servingSize: number | null | undefined;
  servingUnit: string | null | undefined;
  calories: number | null | undefined;
}) {
  const servDisplay =
    servingSize != null ? `${fmt(servingSize)}${servingUnit ? ` ${servingUnit}` : ""}` : "–";

  return (
    <View style={styles.scContainer}>
      <View style={styles.scCol}>
        <Text style={styles.ncLabel}>Serving Size</Text>
        <Text style={styles.scValue}>{servDisplay}</Text>
      </View>
      <View style={styles.scDivider} />
      <View style={styles.scCol}>
        <Text style={styles.ncLabel}>Calories</Text>
        <Text style={styles.scValue}>{fmt(calories)}</Text>
      </View>
    </View>
  );
}

// ─── NutritionPanel ───────────────────────────────────────────────────────────

function NutritionPanel({ nutrition }: { nutrition: Nutrition }) {
  return (
    <View style={styles.npPanel}>
      {/* Row 1: Serving + Calories | Sodium */}
      <View style={styles.npRow}>
        <ServingCalories
          servingSize={nutrition.servingSize}
          servingUnit={nutrition.servingUnit}
          calories={nutrition.calories}
        />
        <NutrientCell
          label="Sodium"
          amount={nutrition.sodium}
          unit="mg"
          rdvPercent={calcDV(nutrition.sodium, 2300)}
          type="limit"
          style={styles.npSideCell}
        />
      </View>

      {/* Row 2: Fat group | Protein */}
      <View style={styles.npRow}>
        <View style={styles.npGroupBox}>
          <NutrientCell label="Total Fat" amount={nutrition.totalFat} unit="g" rdvPercent={calcDV(nutrition.totalFat, 78)} type="limit" style={styles.npGroupCell} />
          <NutrientCell label="Sat. Fat" amount={nutrition.saturatedFat} unit="g" rdvPercent={calcDV(nutrition.saturatedFat, 20)} type="limit" style={styles.npGroupCell} />
          <NutrientCell label="Trans Fat" amount={nutrition.transFat} unit="g" rdvPercent={calcDV(nutrition.transFat, 2)} type="limit" style={styles.npGroupCell} />
        </View>
        <NutrientCell label="Protein" amount={nutrition.protein} unit="g" rdvPercent={calcDV(nutrition.protein, 50)} type="good" style={styles.npSideCell} />
      </View>

      {/* Row 3: Carbs group | Cholesterol */}
      <View style={[styles.npRow, { marginBottom: 6 }]}>
        <View style={styles.npGroupBox}>
          <NutrientCell label="Total Carbs" amount={nutrition.totalCarbohydrates} unit="g" rdvPercent={calcDV(nutrition.totalCarbohydrates, 275)} type="neutral" style={styles.npGroupCell} />
          <NutrientCell label="Fiber" amount={nutrition.dietaryFiber} unit="g" rdvPercent={calcDV(nutrition.dietaryFiber, 28)} type="good" style={styles.npGroupCell} />
          <NutrientCell label="Sugars" amount={nutrition.sugars} unit="g" rdvPercent={calcDV(nutrition.sugars, 50)} type="limit" style={styles.npGroupCell} />
        </View>
        <NutrientCell label="Cholesterol" amount={nutrition.cholesterol} unit="mg" rdvPercent={calcDV(nutrition.cholesterol, 300)} type="limit" style={styles.npSideCell} />
      </View>

      <View style={styles.npDivider} />

      {/* Row 4: Vitamins & Minerals */}
      <View style={[styles.npRow, { marginBottom: 0 }]}>
        <NutrientCell label="Vitamin D" amount={nutrition.vitaminD} unit="mcg" rdvPercent={calcDV(nutrition.vitaminD, 20)} type="good" style={styles.npEqualCell} />
        <NutrientCell label="Calcium" amount={nutrition.calcium} unit="mg" rdvPercent={calcDV(nutrition.calcium, 1300)} type="good" style={styles.npEqualCell} />
        <NutrientCell label="Iron" amount={nutrition.iron} unit="mg" rdvPercent={calcDV(nutrition.iron, 18)} type="good" style={styles.npEqualCell} />
        <NutrientCell label="Potassium" amount={nutrition.potassium} unit="mg" rdvPercent={calcDV(nutrition.potassium, 4700)} type="good" style={styles.npEqualCell} />
      </View>

      {nutrition.ingredients && (
        <>
          <View style={styles.npDivider} />
          <Text style={styles.npIngredLabel}>Ingredients</Text>
          <Text style={styles.npIngredText}>{nutrition.ingredients}</Text>
        </>
      )}
    </View>
  );
}

// ─── MenuItemRow ──────────────────────────────────────────────────────────────

function MenuItemRow({
  item,
  expandedId,
  setExpandedId,
}: {
  item: MenuItem;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [likes, setLikes] = useState(item.likes);
  const [dislikes, setDislikes] = useState(item.dislikes);
  const isExpanded = expandedId === item.id;
  const hasNutrition = !!item.nutrition;

  const handleLike = () => {
    if (vote === "like") {
      setVote(null);
      setLikes((n) => n - 1);
    } else {
      if (vote === "dislike") setDislikes((n) => n - 1);
      setVote("like");
      setLikes((n) => n + 1);
    }
  };

  const handleDislike = () => {
    if (vote === "dislike") {
      setVote(null);
      setDislikes((n) => n - 1);
    } else {
      if (vote === "like") setLikes((n) => n - 1);
      setVote("dislike");
      setDislikes((n) => n + 1);
    }
  };

  return (
    <View>
      <View style={styles.itemRow}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.heartBtn} activeOpacity={0.7}>
            <HeartIcon />
          </TouchableOpacity>
          <View style={styles.voteRow}>
            <TouchableOpacity style={styles.voteBtn} onPress={handleLike} activeOpacity={0.7}>
              <ThumbUpIcon active={vote === "like"} />
              <Text style={[styles.voteCount, vote === "like" && styles.voteCountLike]}>{likes}</Text>
            </TouchableOpacity>
            <View style={styles.voteDivider} />
            <TouchableOpacity style={styles.voteBtn} onPress={handleDislike} activeOpacity={0.7}>
              <ThumbDownIcon active={vote === "dislike"} />
              <Text style={[styles.voteCount, vote === "dislike" && styles.voteCountDislike]}>{dislikes}</Text>
            </TouchableOpacity>
          </View>
          {hasNutrition && (
            <TouchableOpacity
              style={styles.chevronBtn}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              activeOpacity={0.7}>
              <ChevronDownIcon expanded={isExpanded} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {isExpanded && item.nutrition && <NutritionPanel nutrition={item.nutrition} />}
    </View>
  );
}

// ─── MenuSection ──────────────────────────────────────────────────────────────

function MenuSection({
  category,
  items,
  expandedId,
  setExpandedId,
}: {
  category: string;
  items: MenuItem[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>
      </View>
      {items.map((item) => (
        <MenuItemRow key={item.id} item={item} expandedId={expandedId} setExpandedId={setExpandedId} />
      ))}
    </View>
  );
}

// ─── DiningHallCard ───────────────────────────────────────────────────────────

interface DiningHallCardProps {
  hall: DiningHallData;
}

export default function DiningHallCard({ hall }: DiningHallCardProps) {
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
        <MenuSection key={cat} category={cat} items={grouped[cat]} expandedId={expandedId} setExpandedId={setExpandedId} />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card ──
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginHorizontal: 16,
  },

  // ── Header ──
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

  // ── Section ──
  section: {
    marginTop: 4,
  },
  sectionHeader: {
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#86efac",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#374151",
    letterSpacing: 0.8,
  },

  // ── Item row ──
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemName: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13.5,
    color: "#111827",
    marginRight: 8,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heartBtn: {
    padding: 3,
  },
  chevronBtn: {
    padding: 3,
    marginLeft: 2,
  },
  voteRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  voteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  voteDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#e5e7eb",
  },
  voteCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6b7280",
  },
  voteCountLike: {
    color: "#166534",
  },
  voteCountDislike: {
    color: "#b91c1c",
  },

  // ── Nutrient cell ──
  ncCell: {
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  ncLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: "#898787",
    marginBottom: 1,
  },
  ncValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12.5,
    color: "#454545",
  },
  ncRdvRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ncRdvText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 8,
    color: "#888888",
  },
  ncRdvBar: {
    height: 3,
    width: 16,
    borderRadius: 2,
  },

  // ── Serving / Calories ──
  scContainer: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 6,
    alignItems: "center",
  },
  scCol: {
    flex: 1,
    alignItems: "center",
  },
  scValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#454545",
  },
  scDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#D5D5D5",
    marginHorizontal: 6,
  },

  // ── Nutrition panel ──
  npPanel: {
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },
  npRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  npGroupBox: {
    flex: 3,
    flexDirection: "row",
    backgroundColor: "#E8E8E8",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
  },
  npGroupCell: {
    flex: 1,
  },
  npSideCell: {
    flex: 1,
    paddingLeft: 4,
  },
  npEqualCell: {
    flex: 1,
  },
  npDivider: {
    height: 1.5,
    backgroundColor: "#E0E0E0",
    marginVertical: 6,
  },
  npIngredLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10.5,
    color: "#555555",
    marginBottom: 3,
  },
  npIngredText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10.5,
    color: "#666666",
    lineHeight: 15,
  },
});
