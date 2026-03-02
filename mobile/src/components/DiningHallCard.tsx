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
  if (rdvPercent == null || type === "neutral") return "#94a3b8";
  if (type === "good") return "#8BCF95";
  if (rdvPercent < 15) return "#8BCF95";
  if (rdvPercent <= 40) return "#F6C77D";
  return "#FF8989";
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "–";
  return parseFloat(n.toFixed(1)).toString();
}

// ─── Nutrition sub-components ─────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.npSectionLabel}>{label}</Text>;
}

function NutritionDivider() {
  return <View style={styles.npDivider} />;
}

interface NutrientRowProps {
  label: string;
  amount: number | null | undefined;
  unit: string;
  dv: number;
  type: NutrientType;
}

function NutrientRow({ label, amount, unit, dv, type }: NutrientRowProps) {
  const rdv = calcDV(amount, dv);
  const barColor = rdvBarColor(rdv, type);
  const fillPct = rdv != null ? `${Math.min(rdv, 100)}%` : "0%";

  return (
    <View style={styles.npRow}>
      <Text style={styles.npRowLabel}>{label}</Text>
      <Text style={styles.npRowValue}>{amount != null ? `${fmt(amount)} ${unit}` : "–"}</Text>
      <View style={styles.npBarTrack}>
        {rdv != null && (
          <View style={[styles.npBarFill, { width: fillPct, backgroundColor: barColor }]} />
        )}
      </View>
      <Text style={styles.npRowPct}>{rdv != null ? `${rdv}%` : ""}</Text>
    </View>
  );
}

// ─── NutritionPanel ───────────────────────────────────────────────────────────

function NutritionPanel({ nutrition }: { nutrition: Nutrition }) {
  const servDisplay =
    nutrition.servingSize != null
      ? `${fmt(nutrition.servingSize)}${nutrition.servingUnit ? ` ${nutrition.servingUnit}` : ""}`
      : "–";

  return (
    <View style={styles.npPanel}>
      {/* Hero */}
      <View style={styles.npHero}>
        <View>
          <Text style={styles.npHeroCal}>{fmt(nutrition.calories)}</Text>
          <Text style={styles.npHeroCalLabel}>CALORIES</Text>
        </View>
        <View style={styles.npHeroRight}>
          <Text style={styles.npHeroServing}>{servDisplay}</Text>
          <Text style={styles.npHeroServingLabel}>PER SERVING</Text>
        </View>
      </View>

      {/* Macros */}
      <SectionLabel label="MACROS" />
      <NutrientRow label="Total Fat" amount={nutrition.totalFat} unit="g" dv={78} type="limit" />
      <NutrientRow label="Carbohydrates" amount={nutrition.totalCarbohydrates} unit="g" dv={275} type="neutral" />
      <NutrientRow label="Protein" amount={nutrition.protein} unit="g" dv={50} type="good" />
      <NutrientRow label="Sodium" amount={nutrition.sodium} unit="mg" dv={2300} type="limit" />

      <NutritionDivider />

      {/* Details */}
      <SectionLabel label="DETAILS" />
      <NutrientRow label="Saturated Fat" amount={nutrition.saturatedFat} unit="g" dv={20} type="limit" />
      <NutrientRow label="Trans Fat" amount={nutrition.transFat} unit="g" dv={2} type="limit" />
      <NutrientRow label="Dietary Fiber" amount={nutrition.dietaryFiber} unit="g" dv={28} type="good" />
      <NutrientRow label="Sugars" amount={nutrition.sugars} unit="g" dv={50} type="limit" />
      <NutrientRow label="Cholesterol" amount={nutrition.cholesterol} unit="mg" dv={300} type="limit" />

      <NutritionDivider />

      {/* Vitamins & Minerals */}
      <SectionLabel label="VITAMINS & MINERALS" />
      <NutrientRow label="Vitamin D" amount={nutrition.vitaminD} unit="mcg" dv={20} type="good" />
      <NutrientRow label="Calcium" amount={nutrition.calcium} unit="mg" dv={1300} type="good" />
      <NutrientRow label="Iron" amount={nutrition.iron} unit="mg" dv={18} type="good" />
      <NutrientRow label="Potassium" amount={nutrition.potassium} unit="mg" dv={4700} type="good" />

      {nutrition.ingredients && (
        <>
          <NutritionDivider />
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
  // ── Card ──
  card: {
    backgroundColor: "#ffffff",
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

  // ── Nutrition panel ──
  npPanel: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  // Hero
  npHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0faf4",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
  },
  npHeroCal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 44,
    lineHeight: 48,
    color: "#166534",
  },
  npHeroCalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9.5,
    color: "#9ca3af",
    letterSpacing: 1.2,
  },
  npHeroRight: {
    alignItems: "flex-end",
  },
  npHeroServing: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#374151",
  },
  npHeroServingLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9.5,
    color: "#9ca3af",
    letterSpacing: 1.2,
  },

  // Section label
  npSectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    color: "#9ca3af",
    letterSpacing: 1.2,
    paddingTop: 2,
    paddingBottom: 4,
  },

  // Nutrient rows
  npRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  npRowLabel: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#374151",
  },
  npRowValue: {
    width: 74,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#111827",
    textAlign: "right",
    marginRight: 10,
  },
  npBarTrack: {
    width: 54,
    height: 5,
    backgroundColor: "#EBEBEB",
    borderRadius: 3,
    overflow: "hidden",
  },
  npBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  npRowPct: {
    width: 34,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "right",
  },

  // Divider
  npDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 10,
  },

  // Ingredients
  npIngredLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12.5,
    color: "#374151",
    marginBottom: 5,
  },
  npIngredText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
});
