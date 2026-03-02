import { View, Text, StyleSheet } from "react-native";
import { MenuItem } from "../data/dummyMenu";
import { NutrientCell, fmt } from "./NutrientCell";

export function MenuItemAccordion({ item }: { item: MenuItem }) {
  const nutrition = item.nutrition;
  if (!nutrition) return null;

  return (
    <View style={styles.npPanel}>
      {/* ── Row 1: Serving+Calories (span 3) | Sodium ── */}
      <View style={[styles.npGridRow, styles.npRow1]}>
        <View style={styles.npServCalOuter}>
          <View style={styles.npServCalInner}>
            <View style={styles.npServCell}>
              <Text style={styles.npCellLabel}>Serving Size</Text>
              <Text style={styles.npCellValue} numberOfLines={1}>
                {fmt(nutrition.servingSize)}
                {nutrition.servingUnit != null && (
                  <Text style={styles.npCellUnit}>{" "}{nutrition.servingUnit}</Text>
                )}
              </Text>
            </View>
            <View style={styles.npVertDiv} />
            <View style={styles.npCalCell}>
              <Text style={styles.npCellLabel}>Calories</Text>
              <Text style={styles.npCalValue}>
                {nutrition.calories != null ? Math.round(nutrition.calories) : "–"}
              </Text>
            </View>
          </View>
        </View>
        <NutrientCell label="Sodium" amount={nutrition.sodium} unit="mg" dv={2300} type="limit" />
      </View>

      {/* ── Row 2: Total Fat | Sat Fat | Trans Fat | Protein ── */}
      <View style={[styles.npGridRow, styles.npRow2]}>
        <NutrientCell label="Total Fat" amount={nutrition.totalFat} unit="g" dv={78} type="limit" />
        <NutrientCell label="Sat. Fat" amount={nutrition.saturatedFat} unit="g" dv={20} type="limit" />
        <NutrientCell label="Trans Fat" amount={nutrition.transFat} unit="g" dv={2} type="limit" />
        <NutrientCell label="Protein" amount={nutrition.protein} unit="g" dv={50} type="good" />
      </View>

      {/* ── Row 3: Total Carbs | Fiber | Sugars | Cholesterol ── */}
      <View style={[styles.npGridRow, styles.npRow3]}>
        <NutrientCell label="Total Carbs" amount={nutrition.totalCarbohydrates} unit="g" dv={275} type="neutral" />
        <NutrientCell label="Fiber" amount={nutrition.dietaryFiber} unit="g" dv={28} type="good" />
        <NutrientCell label="Sugars" amount={nutrition.sugars} unit="g" dv={50} type="limit" />
        <NutrientCell label="Cholesterol" amount={nutrition.cholesterol} unit="mg" dv={300} type="limit" />
      </View>

      {/* ── Divider ── */}
      <View style={styles.npHorizDiv} />

      {/* ── Row 4: Vitamin D | Calcium | Iron | Potassium ── */}
      <View style={styles.npGridRow}>
        <NutrientCell label="Vitamin D" amount={nutrition.vitaminD} unit="mcg" dv={20} type="good" />
        <NutrientCell label="Calcium" amount={nutrition.calcium} unit="mg" dv={1300} type="good" />
        <NutrientCell label="Iron" amount={nutrition.iron} unit="mg" dv={18} type="good" />
        <NutrientCell label="Potassium" amount={nutrition.potassium} unit="mg" dv={4700} type="good" />
      </View>

      {/* ── Ingredients ── */}
      {nutrition.ingredients && (
        <>
          <View style={styles.npHorizDiv} />
          <View style={styles.npIngredSection}>
            <Text style={styles.npIngredLabel}>Ingredients</Text>
            <Text style={styles.npIngredText}>{nutrition.ingredients}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  npPanel: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDEDED",
  },

  // Grid rows
  npGridRow: {
    flexDirection: "row",
  },
  npRow1: {
    paddingBottom: 2,
  },
  npRow2: {
    paddingBottom: 2,
  },
  npRow3: {
    paddingBottom: 4,
  },

  // Serving + Calories cell (flex:3)
  npServCalOuter: {
    flex: 3,
    paddingVertical: 7,
    paddingHorizontal: 3,
  },
  npServCalInner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#EFEFEF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  npServCell: {
    flex: 1,
  },
  npVertDiv: {
    width: 1.5,
    height: 34,
    backgroundColor: "#C0C0C0",
    borderRadius: 1,
    marginHorizontal: 6,
  },
  npCalCell: {
    flex: 1,
  },
  npCalValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#111827",
    lineHeight: 24,
  },

  // Shared cell text styles (mirrors NutrientCell for the serving/cal section)
  npCellLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    color: "#8a8a8a",
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  npCellValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12.5,
    color: "#111827",
    lineHeight: 16,
  },
  npCellUnit: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#374151",
  },

  // Divider
  npHorizDiv: {
    height: 2,
    backgroundColor: "#E9E9E9",
    borderRadius: 1,
    marginVertical: 2,
  },

  // Ingredients
  npIngredSection: {
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  npIngredLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#374151",
    marginBottom: 4,
  },
  npIngredText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11.5,
    color: "#6b7280",
    lineHeight: 17,
  },
});
