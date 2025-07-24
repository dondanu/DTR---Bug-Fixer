import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FooterProps {
  onDashboardPress?: () => void;
  onProjectsPress?: () => void;
  onAnalyticsPress?: () => void;
  onProfilePress?: () => void;
  activeTab?: 'dashboard' | 'projects' | 'analytics' | 'profile';
}

const Footer: React.FC<FooterProps> = ({
  onDashboardPress,
  onProjectsPress,
  onAnalyticsPress,
  onProfilePress,
  activeTab = 'dashboard'
}) => {
  return (
    <View style={styles.footerContainer}>
      {/* Dashboard Tab */}
      <TouchableOpacity
        style={[
          styles.footerButton,
          activeTab === 'dashboard' && styles.activeButton
        ]}
        onPress={() => {
          console.log('Dashboard clicked');
          onDashboardPress?.();
        }}
      >
        <Text style={[
          styles.iconText,
          { color: activeTab === 'dashboard' ? '#3b82f6' : '#666' }
        ]}>
          📊
        </Text>
        <Text style={[
          styles.tabLabel,
          { color: activeTab === 'dashboard' ? '#3b82f6' : '#666' }
        ]}>
          Dashboard
        </Text>
      </TouchableOpacity>

      {/* Projects Tab */}
      <TouchableOpacity
        style={[
          styles.footerButton,
          activeTab === 'projects' && styles.activeButton
        ]}
        onPress={() => {
          console.log('Projects clicked');
          onProjectsPress?.();
        }}
      >
        <Text style={[
          styles.iconText,
          { color: activeTab === 'projects' ? '#3b82f6' : '#666' }
        ]}>
          📁
        </Text>
        <Text style={[
          styles.tabLabel,
          { color: activeTab === 'projects' ? '#3b82f6' : '#666' }
        ]}>
          Projects
        </Text>
      </TouchableOpacity>

      {/* Analytics Tab */}
      <TouchableOpacity
        style={[
          styles.footerButton,
          activeTab === 'analytics' && styles.activeButton
        ]}
        onPress={() => {
          console.log('Analytics clicked');
          onAnalyticsPress?.();
        }}
      >
        <Text style={[
          styles.iconText,
          { color: activeTab === 'analytics' ? '#3b82f6' : '#666' }
        ]}>
          📈
        </Text>
        <Text style={[
          styles.tabLabel,
          { color: activeTab === 'analytics' ? '#3b82f6' : '#666' }
        ]}>
          Analytics
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={[
          styles.footerButton,
          activeTab === 'profile' && styles.activeButton
        ]}
        onPress={() => {
          console.log('Profile clicked');
          onProfilePress?.();
        }}
      >
        <Text style={[
          styles.iconText,
          { color: activeTab === 'profile' ? '#3b82f6' : '#666' }
        ]}>
          👤
        </Text>
        <Text style={[
          styles.tabLabel,
          { color: activeTab === 'profile' ? '#3b82f6' : '#666' }
        ]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    minWidth: 70,
  },
  activeButton: {
    backgroundColor: '#e6f2ff',
  },
  iconText: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Footer;
