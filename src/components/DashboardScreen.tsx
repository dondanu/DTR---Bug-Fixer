import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from './Header';
import Footer from './Footer';


const screenWidth = Dimensions.get('window').width;

// Types
type Project = {
  id: number;
  projectName: string;
  // ...other fields as needed
};
type Defect = {
  projectId: number;
  defectStatusName: string;
  // ...other fields as needed
};

interface DashboardScreenProps {
  onProfilePress?: () => void;
  onLogoutPress?: () => void;
  onProjectPress?: (projectId: number, projectName: string) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onProfilePress,
  onLogoutPress,
  onProjectPress
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [cardColors, setCardColors] = useState<{ [projectId: number]: string }>({});


  useEffect(() => {
    // API Call 1: Fetch Projects
    const projectsUrl = 'http://34.56.162.48:8087/api/v1/projects';
    console.log('🔥 API Request Details:');
    console.log('Request URL:', projectsUrl);
    console.log('Request Method: GET');
    console.log('Referrer Policy: strict-origin-when-cross-origin');

    fetch(projectsUrl)
      .then(r => {
        console.log('Status Code:', r.status);
        return r.json();
      })
      .then(res => {
        setProjects(res.data || []);
        // Fetch card colors for all projects
        (res.data || []).forEach((project: Project) => {
          const colorUrl = `http://34.56.162.48:8087/api/v1/dashboard/project-card-color/${project.id}`;

          // API Call 2: Fetch Project Card Colors
          console.log('🎨 API Request Details:');
          console.log('Request URL:', colorUrl);
          console.log('Request Method: GET');
          console.log('Referrer Policy: strict-origin-when-cross-origin');

          fetch(colorUrl)
            .then(r => {
              console.log('Status Code:', r.status);
              return r.json();
            })
            .then(colorRes => {
              setCardColors(prev => ({
                ...prev,
                [project.id]: parseColorString(colorRes.data.projectCardColor)
              }));
            });
        });
      });

    // API Call 3: Fetch Defect Status
    const defectsUrl = 'http://34.56.162.48:8087/api/v1/defectStatus';
    console.log('🐛 API Request Details:');
    console.log('Request URL:', defectsUrl);
    console.log('Request Method: GET');
    console.log('Referrer Policy: strict-origin-when-cross-origin');

    fetch(defectsUrl)
      .then(r => {
        console.log('Status Code:', r.status);
        return r.json();
      })
      .then(res => setDefects(res.data || []));


  }, []);

  function parseColorString(colorString: string): string {
    // Example: "bg-gradient-to-r from-red-600 to-red-800"
    const lowerColor = colorString.toLowerCase();
    if (lowerColor.includes('red')) return '#ce1111';
    if (lowerColor.includes('yellow') || lowerColor.includes('amber') || lowerColor.includes('orange')) return '#eed61c';
    if (lowerColor.includes('green') || lowerColor.includes('emerald')) return '#06ba0b';
    return '#888'; // fallback
  }

  // Helper: get risk for a project based on color
  function getProjectRisk(projectId: number): 'high' | 'medium' | 'low' {
    const projectColor = cardColors[projectId];
    if (!projectColor) {
      // Fallback to defect-based logic if no color is set
      const projectDefects = defects.filter(d => d.projectId === projectId);
      if (projectDefects.some(d => d.defectStatusName === 'REOPEN' || d.defectStatusName === 'NEW')) return 'high';
      if (projectDefects.some(d => d.defectStatusName === 'OPEN')) return 'medium';
      return 'low';
    }

    // Determine risk based on project color
    // Red color = High Risk
    if (projectColor === '#ce1111') return 'high';
    // Yellow color = Medium Risk
    if (projectColor === '#eed61c') return 'medium';
    // Green color = Low Risk
    if (projectColor === '#06ba0b') return 'low';

    // Default fallback
    return 'low';
  }

  // Helper: get risk text based on project color
  function getRiskTextByColor(projectColor: string): string {
    if (projectColor === '#ce1111') return 'High Risk';
    if (projectColor === '#eed61c') return 'Medium Risk';
    if (projectColor === '#06ba0b') return 'Low Risk';
    return 'Low Risk'; // Default
  }

  // Risk counts
  const highRiskProjects = projects.filter(p => getProjectRisk(p.id) === 'high');
  const mediumRiskProjects = projects.filter(p => getProjectRisk(p.id) === 'medium');
  const lowRiskProjects = projects.filter(p => getProjectRisk(p.id) === 'low');

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const risk = getProjectRisk(p.id);
    if (riskFilter === 'all') return true;
    return risk === riskFilter;
  });



    return (
    <SafeAreaView style={styles.safeArea}>
      <Header onLogoutPress={onLogoutPress} />
      <ScrollView style={styles.container}>
      {/* Heading */}
      <Text style={styles.heading}>Dashboard Overview</Text>
      <Text style={styles.subtitle}>
        Gain insights into your projects with real-time health metrics and status summaries
      </Text>
      <View style={styles.divider} />

      {/* Project Status Insights */}
            <Text style={styles.sectionTitle}>Project Status Insights</Text>
      <View style={styles.statusRow}>
        <StatusCard
          color="#ce1111"
          icon="⚠️"
          title="High Risk Projects"
          count={highRiskProjects.length}
          subtitle="Immediate attention required"
        />
        <StatusCard
          color="#eed61c"
          icon="⚡"
          title="Medium Risk Projects"
          count={mediumRiskProjects.length}
          subtitle="Monitor progress closely"
        />
        <StatusCard
          color="#06ba0b"
          icon="✅"
          title="Low Risk Projects"
          count={lowRiskProjects.length}
          subtitle="Stable and on track"
        />
              </View>

      {/* All Projects */}
            <Text style={styles.sectionTitle}>All Projects</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterContentContainer}
      >
        {['all', 'high', 'medium', 'low'].map(risk => (
                  <TouchableOpacity
            key={risk}
                    style={[
                      styles.filterButton,
              riskFilter === risk && {
                backgroundColor:
                  risk === 'high' ? '#ce1111' :
                  risk === 'medium' ? '#eed61c' :
                  risk === 'low' ? '#06ba0b' : '#3b82f6'
              }
                    ]}
            onPress={() => setRiskFilter(risk as 'all' | 'high' | 'medium' | 'low')}
                  >
            <Text style={[
                        styles.filterButtonText,
              riskFilter === risk && { color: '#fff' }
            ]}>
              {risk === 'all'
                ? 'All Projects'
                : risk.charAt(0).toUpperCase() + risk.slice(1) + ' Risk'}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Project Cards */}
      <View style={styles.projectCardsRow}>
        {filteredProjects.map((project) => {
          const risk = getProjectRisk(project.id);
          const projectColor = cardColors[project.id] || getRiskColor(risk);
                return (
            <View key={project.id} style={styles.projectCardWrapper}>
              <TouchableOpacity
                style={[
                  styles.projectCard,
                  { backgroundColor: projectColor }
                ]}
                onPress={() => {
                  console.log(`🎯 Project clicked: ${project.projectName} (ID: ${project.id})`);
                  if (onProjectPress) {
                    onProjectPress(project.id, project.projectName);
                  } else {
                    console.log('⚠️ onProjectPress callback not provided');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.projectCardText}>{project.projectName}</Text>
            <View style={[
                  styles.riskLabel,
                  { backgroundColor: projectColor }
                ]}>
                  <Text style={styles.riskLabelText}>
                    {getRiskTextByColor(projectColor)}
              </Text>
            </View>
              </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
      </ScrollView>
      <Footer
        activeTab="dashboard"
        onDashboardPress={() => {}}
        onProjectsPress={() => {
          // TODO: Navigate to Projects screen
        }}
        onAnalyticsPress={() => {
          // TODO: Navigate to Analytics screen
        }}
        onProfilePress={onProfilePress}
      />
    </SafeAreaView>
  );
};

// Status Card Component
function StatusCard({ color, icon, title, count, subtitle }: {
  color: string;
  icon: string;
  title: string;
  count: number;
  subtitle: string;
}) {
  return (
    <View style={[styles.statusCard, { borderColor: color }]}>
      <Text style={styles.statusCardIcon}>{icon}</Text>
      <Text style={[styles.statusCardTitle, { color }]}>{title}</Text>
      <Text style={[styles.statusCardCount, { color }]}>{count}</Text>
      <Text style={styles.statusCardSubtitle}>{subtitle}</Text>
        </View>
  );
}

// Helper for risk color
function getRiskColor(risk: 'high' | 'medium' | 'low') {
  switch (risk) {
    case 'high': return '#ce1111';
    case 'medium': return '#eed61c';
    case 'low': return '#06ba0b';
    default: return '#ccc';
  }
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontSize: 28, fontWeight: 'bold', marginTop: 24, textAlign: 'center', color: '#222' },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginVertical: 8 },
  divider: { height: 4, width: 80, backgroundColor: '#3b82f6', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 24, marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statusCard: {
    flex: 1, marginHorizontal: 4, backgroundColor: '#fff', borderRadius: 16, borderWidth: 2,
    alignItems: 'center', padding: 12, elevation: 2
  },
  statusCardIcon: { fontSize: 32, marginBottom: 4 },
  statusCardTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  statusCardCount: { fontSize: 28, fontWeight: 'bold', marginVertical: 2 },
  statusCardSubtitle: { fontSize: 12, color: '#888', textAlign: 'center' },
  filterScrollContainer: {
    marginVertical: 12,
  },
  filterContentContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  filterButtonText: { color: '#222', fontWeight: 'bold' },
  projectCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  projectCardWrapper: {
    width: '33.33%', // This ensures exactly 3 cards per row
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  projectCard: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    position: 'relative',
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#ce1111', // fallback
  },
  projectCardText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  riskLabel: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // Semi-transparent overlay
  },
  riskLabelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

});

export default DashboardScreen;