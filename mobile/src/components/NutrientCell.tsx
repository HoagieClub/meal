import { View, Text, StyleSheet } from "react-native";

export type NutrientType = "limit" | "good" | "neutral";

function calcDV(amount: number | null | undefined, dv: number): number | null {
  if (amount == null) return null;
  return Math.round((amount / dv) * 100);
}

function rdvColor(rdv: number | null, type: NutrientType): string {
  if (rdv == null || type === "neutral") return "#C9C9C9";
  if (type === "good") return "#8BCF95";
  if (rdv < 15) return "#8BCF95";
  if (rdv <= 40) return "#F6C77D";
  return "#FF8989";
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return "–";
  return parseFloat(n.toFixed(1)).toString();
}

export function NutrientCell({
  label,
  amount,
  unit,
  dv,
  type,
}: {
  label: string;
  amount: number | null | undefined;
  unit: string;
  dv: number;
  type: NutrientType;
}) {
  const rdv = calcDV(amount, dv);
  const color = rdvColor(rdv, type);

  return (
    <View style={styles.npCell}>
      <Text style={styles.npCellLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.npCellValue} numberOfLines={1}>
        {amount != null ? fmt(amount) : "–"}
        {amount != null && <Text style={styles.npCellUnit}>{" "}{unit}</Text>}
      </Text>
      {rdv != null ? (
        <View style={styles.npRdvRow}>
          <Text style={styles.npRdvPct}>{rdv}%</Text>
          <View style={[styles.npRdvDash, { backgroundColor: color }]} />
          <Text style={styles.npRdvLabel}>RDV</Text>
        </View>
      ) : (
        <View style={styles.npRdvSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  npCell: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 7,
  },
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
  npRdvRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
  },
  npRdvPct: {
    fontFamily: "Poppins_400Regular",
    fontSize: 8.5,
    color: "#6A6868",
  },
  npRdvDash: {
    width: 13,
    height: 2,
    borderRadius: 1,
  },
  npRdvLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 8.5,
    color: "#9ca3af",
  },
  npRdvSpacer: {
    height: 11,
    marginTop: 3,
  },
});
