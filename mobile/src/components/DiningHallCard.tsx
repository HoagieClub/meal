import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { DiningHallData, MenuItem } from "../data/dummyMenu";

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

function MenuItemRow({ item }: { item: MenuItem }) {
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [likes, setLikes] = useState(item.likes);
  const [dislikes, setDislikes] = useState(item.dislikes);

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
      </View>
    </View>
  );
}

function MenuSection({ category, items }: { category: string; items: MenuItem[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>
      </View>
      {items.map((item) => (
        <MenuItemRow key={item.id} item={item} />
      ))}
    </View>
  );
}

interface DiningHallCardProps {
  hall: DiningHallData;
}

export default function DiningHallCard({ hall }: DiningHallCardProps) {
  const [pinned, setPinned] = useState(false);

  // Group items by category, preserving first-seen order
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.hallName}>{hall.displayName}</Text>
          <TouchableOpacity onPress={() => setPinned((p) => !p)} activeOpacity={0.7} style={styles.pinBtn}>
            <PinIcon pinned={pinned} />
          </TouchableOpacity>
        </View>
        {/* Banner placeholder */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{hall.displayName[0]}</Text>
        </View>
      </View>

      {/* Menu sections */}
      {categories.map((cat) => (
        <MenuSection key={cat} category={cat} items={grouped[cat]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 16,
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
});
