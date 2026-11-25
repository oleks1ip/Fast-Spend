import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { icons } from '../theme/icons';
import { colors } from '../theme/colors';

export default function NavigationBar({ activeScreen, navigation }) {
  return (
    <View style={styles.bottomBar}>
      {/* Home */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Home')}
      >
        <icons.House style={[
            styles.navIcon, 
            { color: activeScreen === 'Home' ? colors.primary : colors.textSecondary }
          ]} />
        <Text style={[styles.navLabel, activeScreen === 'Home' && styles.activeNav]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* History */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('History')}
      >
        <icons.Timeline style={[
            styles.navIcon, 
            { color: activeScreen === 'History' ? colors.primary : colors.textSecondary }
          ]} />
        <Text style={[styles.navLabel, activeScreen === 'History' && styles.activeNav]}>
          History
        </Text>
      </TouchableOpacity>

      {/* Analytics */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Analytics')}
      >
        <icons.ChartNoAxesCombined style={[
            styles.navIcon, 
            { color: activeScreen === 'Analytics' ? colors.primary : colors.textSecondary }
          ]} />
        <Text style={[styles.navLabel, activeScreen === 'Analytics' && styles.activeNav]}>
          Analytics
        </Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Settings')}
      >
        <icons.Settings style={[
            styles.navIcon, 
            { color: activeScreen === 'Settings' ? colors.primary : colors.textSecondary }
          ]} />
        <Text style={[styles.navLabel, activeScreen === 'Settings' && styles.activeNav]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  navEmojiIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  navLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeNav: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});