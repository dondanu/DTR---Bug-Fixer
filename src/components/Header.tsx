import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';

interface HeaderProps {
  onLogoutPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoutPress }) => {

  const handleExitPress = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            if (onLogoutPress) {
              onLogoutPress();
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Defect Tracker</Text>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleExitPress}
      >
        <Image
          source={require('../assets/images/exit.png')}
          style={styles.exitIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },
  exitIcon: {
    width: 22,
    height: 22,
  },

});

export default Header;
