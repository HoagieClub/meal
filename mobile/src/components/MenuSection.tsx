import { View, Text, StyleSheet } from "react-native";
import { MenuItem } from "../data/dummyMenu";
import { MenuItemRow } from "./MenuItemRow";

export function MenuSection({
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

const styles = StyleSheet.create({
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
});
