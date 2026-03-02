import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { MenuItem } from "../data/dummyMenu";
import { MenuItemAccordion } from "./MenuItemAccordion";

// ─── Icons ────────────────────────────────────────────────────────────────────

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

// ─── MenuItemRow ──────────────────────────────────────────────────────────────

export function MenuItemRow({
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
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
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
      {isExpanded && <MenuItemAccordion item={item} />}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
