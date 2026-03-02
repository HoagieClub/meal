import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";

function ArrowLeftIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="currentColor">
      <Path
        d="M18 9H4.41L8.7 4.71c.19-.18.3-.43.3-.71a1.003 1.003 0 00-1.71-.71l-6 6c-.18.18-.29.43-.29.71 0 .28.11.53.29.71l6 6a1.003 1.003 0 001.42-1.42L4.41 11H18c.55 0 1-.45 1-1s-.45-1-1-1z"
        fill="#343434"
        fillRule="evenodd"
      />
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

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar} />

      <View style={styles.nav}>
        <View style={styles.logoRow}>
          <Text style={styles.logoHoagie}>hoagie</Text>
          <Text style={styles.logoMeal}>meal</Text>
          <Text style={styles.logoBeta}> BETA</Text>
        </View>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.navLink}>Menu</Text>
          </TouchableOpacity>
          <Text style={styles.navLink}>Login</Text>
        </View>
      </View>
      <View style={styles.navDivider} />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.title}>Hoagie Meal</Text>
          <Text style={styles.subtitle}>Track your meals.</Text>
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85}>
            <View style={styles.loginIconBox}>
              <Text style={styles.loginIconText}>h</Text>
            </View>
            <Text style={styles.loginBtnText}>
              Login using hoagie<Text style={styles.bold}>profile</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85}>
            <ArrowLeftIcon />
            <Text style={styles.backBtnText}>
              {"  "}Back to hoagie<Text style={styles.bold}>platform</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.copyright}>© 2025 Hoagie Club.</Text>
        </View>

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
  navLinks: {
    flexDirection: "row",
    gap: 16,
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
  body: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  // elevation={1} in Evergreen = subtle border + faint shadow
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 56,
    alignItems: "center",
    shadowColor: "#10261e",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  // Heading size={900} = 32px, Poppins bold
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    color: "#000000",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#343434",
    textAlign: "center",
    marginBottom: 30,
  },
  // Primary button — Evergreen UI default primary = blue ~#3d5af1
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3d5af1",
    borderRadius: 4,
    width: "85%",
    height: 48,
    marginBottom: 16,
    overflow: "hidden",
  },
  loginIconBox: {
    backgroundColor: "#2d46d6",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loginIconText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#ffffff",
  },
  loginBtnText: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#ffffff",
  },
  // Default button — Evergreen UI default = white with border
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D2D2D2",
    width: "85%",
    height: 48,
    marginBottom: 24,
  },
  backBtnText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#343434",
  },
  bold: {
    fontFamily: "Poppins_700Bold",
  },
  copyright: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#343434",
  },
  // Footer — mirrors Footer component layout
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    paddingBottom: 16,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#343434",
  },
});
