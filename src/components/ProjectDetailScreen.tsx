import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions
} from 'react-native';
import Header from './Header';
import Footer from './Footer';
import { getDefectSeverityIndex } from '../api/dsi';
import { getDefectRemarkRatioByProjectId } from '../api/remarkratio';
import { getReopenCountSummary } from '../api/Defectreopen';
import { getDefectTypeByProjectId } from '../api/defecttype';
import { getDefectsByModule } from '../api/defectbymodule';
import { getDefectDensity } from '../api/defectdensity';
import GaugeChart from './GaugeChart';
import DynamicPieChart from './DynamicPieChart';
import SeverityPieChart from './SeverityPieChart';

const screenWidth = Dimensions.get('window').width;

interface ProjectDetailScreenProps {
  projectId: number;
  projectName: string;
  onDashboardPress: () => void;
  onProfilePress: () => void;
  onLogoutPress: () => void;
}

const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  projectId,
  projectName,
  onDashboardPress,
  onProfilePress,
  onLogoutPress
}) => {
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProjectTab, setSelectedProjectTab] = useState(projectId);
  const [defectStats, setDefectStats] = useState({
    high: { recent: 0, expired: 0, open: 0, fixed: 0, duplicate: 0, total: 12 },
    medium: { recent: 0, logical: 0, open: 0, backlog: 0, duplicate: 0, total: 8 },
    low: { recent: 0, logical: 0, open: 0, fixed: 0, duplicate: 0, total: 3 },
    density: 10.12,
    severityIndex: 43.6,
    remarkRatio: 97.75,
    remarkCategory: 'High',
    remarkColor: 'red'
  });
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [severitySummary, setSeveritySummary] = useState<any>(null);
  const [reopenCountData, setReopenCountData] = useState<any>(null);
  const [defectTypeData, setDefectTypeData] = useState<any>(null);
  const [defectsByModuleData, setDefectsByModuleData] = useState<any>(null);
  const [defectsByModuleError, setDefectsByModuleError] = useState<boolean>(false);
  const [remarkRatioError, setRemarkRatioError] = useState<boolean>(false);
  const [selectedSeverityChart, setSelectedSeverityChart] = useState<'high' | 'medium' | 'low' | null>(null);
  const [projectRiskLevel, setProjectRiskLevel] = useState<string>('Medium Risk');
  const [projectCardData, setProjectCardData] = useState<{ [projectId: number]: any }>({});

  // Keep this useEffect to maintain hook order (but without console logs)
  useEffect(() => {
    // Silently monitor severity summary changes
  }, [severitySummary]);

  useEffect(() => {
    // Fetch all projects for the project selection tabs
    const fetchAllProjects = async () => {
      try {
        const projectsUrl = 'http://34.56.162.48:8087/api/v1/projects';
        const response = await fetch(projectsUrl);
        const data = await response.json();
        setAllProjects(data.data || []);

        // Fetch project card colors for all projects
        (data.data || []).forEach((project: any) => {
          const colorUrl = `http://34.56.162.48:8087/api/v1/dashboard/project-card-color/${project.id}`;


          fetch(colorUrl)
            .then(r => {

              return r.json();
            })
            .then(colorRes => {

              if (colorRes.data) {
                setProjectCardData(prev => ({
                  ...prev,
                  [project.id]: colorRes.data
                }));
              }
            })
            .catch(() => {
              // Silently handle error
            });
        });
      } catch (error) {
        // Silently handle error
      }
    };

    fetchAllProjects();
  }, []);

  useEffect(() => {
    // Fetch project details and defect statistics
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setRemarkRatioError(false); // Reset error state
        setDefectsByModuleError(false); // Reset error state

        // 🚀 OPTIMIZED: Run all API calls in parallel using Promise.all for MUCH faster performance

        const [
          statsResponse,
          defectsResponse,
          severityResponse,
          dsiData,
          defectDensityData,
          remarkRatioData,
          reopenData,
          defectTypeResponse,
          defectsByModuleResponse
        ] = await Promise.all([
          // API Call 1: Fetch defect statistics
          fetch(`http://34.56.162.48:8087/api/v1/defect-statistics/${selectedProjectTab}`),
          // API Call 2: Fetch defects for this project
          fetch(`http://34.56.162.48:8087/api/v1/defects/project/${selectedProjectTab}`),
          // API Call 3: Fetch defect severity summary
          fetch(`http://34.56.162.48:8087/api/v1/dashboard/defect_severity_summary/${selectedProjectTab}`),
          // API Call 4: Fetch defect severity index
          getDefectSeverityIndex(selectedProjectTab).catch(err => ({ error: err })),
          // API Call 5: Fetch defect density
          getDefectDensity(selectedProjectTab).catch(err => ({ error: err })),
          // API Call 6: Fetch defect to remark ratio
          getDefectRemarkRatioByProjectId(selectedProjectTab).catch(err => ({ error: err })),
          // API Call 7: Fetch reopen count summary
          getReopenCountSummary(selectedProjectTab).catch(err => ({ error: err })),
          // API Call 8: Fetch defect distribution by type
          getDefectTypeByProjectId(selectedProjectTab).catch(err => ({ error: err })),
          // API Call 9: Fetch defects by module
          getDefectsByModule(selectedProjectTab).catch(err => ({ error: err }))
        ]);

        // 🚀 CRITICAL FIX: Parse all JSON responses in parallel too!
        const [statsData, defectsData, severityData] = await Promise.all([
          statsResponse.ok ? statsResponse.json() : Promise.resolve(null),
          defectsResponse.json(),
          severityResponse.ok ? severityResponse.json() : Promise.resolve(null)
        ]);



        // Process API Call 1: Defect statistics
        if (statsData) {
          setDefectStats(statsData.data || defectStats);
        }

        // Process API Call 2: Defects data
        setDefects(defectsData.data || []);

        // Process API Call 3: Defect severity summary
        if (severityData && severityData.data?.defectSummary) {


          // Transform the API response to match our component structure
          if (severityData.data?.defectSummary) {
            const transformedData = {
              high: {},
              medium: {},
              low: {},
              totalDefects: severityData.data.totalDefects
            };

            // Process each severity level from the API response
            severityData.data.defectSummary.forEach((severityItem: any) => {

              const severityLevel = severityItem.severity?.toLowerCase();

              if (severityLevel === 'high') {
                // Let's use ALL available fields from API instead of hardcoded ones
                const highData: any = { total: severityItem.total || 0 };
                Object.keys(severityItem).forEach(key => {
                  if (key !== 'severity' && key !== 'total') {
                    highData[key] = severityItem[key] || 0;
                  }
                });
                transformedData.high = highData;

              } else if (severityLevel === 'medium') {
                // Let's use ALL available fields from API instead of hardcoded ones
                const mediumData: any = { total: severityItem.total || 0 };
                Object.keys(severityItem).forEach(key => {
                  if (key !== 'severity' && key !== 'total') {
                    mediumData[key] = severityItem[key] || 0;
                  }
                });
                transformedData.medium = mediumData;

              } else if (severityLevel === 'low') {
                // Let's use ALL available fields from API instead of hardcoded ones
                const lowData: any = { total: severityItem.total || 0 };
                Object.keys(severityItem).forEach(key => {
                  if (key !== 'severity' && key !== 'total') {
                    lowData[key] = severityItem[key] || 0;
                  }
                });
                transformedData.low = lowData;
              }
            });

            setSeveritySummary(transformedData);
          }
        }

        // Process API Call 4: Defect severity index (already fetched in parallel)
        if (dsiData && !dsiData.error && dsiData.data && typeof dsiData.data.dsiPercentage === 'number') {
          setDefectStats(prevStats => ({
            ...prevStats,
            severityIndex: dsiData.data.dsiPercentage
          }));
          if (dsiData.data.interpretation) {
            setProjectRiskLevel(dsiData.data.interpretation);
          }
        } else if (dsiData && !dsiData.error && dsiData.data === 0) {
          setDefectStats(prevStats => ({
            ...prevStats,
            severityIndex: 0
          }));
          setProjectRiskLevel('Low Risk');
        } else if (dsiData?.error) {
          // Silently handle error
        }

        // Process API Call 5: Defect density (already fetched in parallel)
        if (defectDensityData && !defectDensityData.error && defectDensityData.data && typeof defectDensityData.data.defectDensity === 'number') {
          setDefectStats(prevStats => ({
            ...prevStats,
            density: defectDensityData.data.defectDensity
          }));
        } else if (defectDensityData && !defectDensityData.error && defectDensityData.data === 0) {
          setDefectStats(prevStats => ({
            ...prevStats,
            density: 0
          }));
        } else if (defectDensityData?.error) {
          // Silently handle error
        }

        // Process API Call 6: Defect to remark ratio (already fetched in parallel)
        if (remarkRatioData && !remarkRatioData.error && remarkRatioData.data && remarkRatioData.data.ratio) {
          const ratioString = remarkRatioData.data.ratio;
          const ratioNumber = parseFloat(ratioString.replace('%', ''));
          setDefectStats(prevStats => ({
            ...prevStats,
            remarkRatio: ratioNumber,
            remarkCategory: remarkRatioData.data.category || 'Medium',
            remarkColor: remarkRatioData.data.color || 'green'
          }));
          setRemarkRatioError(false);
        } else if (remarkRatioData?.error) {
          // Silently handle error
          setRemarkRatioError(true);
        }

        // Process API Call 7: Reopen count summary (already fetched in parallel)
        if (reopenData && !reopenData.error) {
          if (reopenData.message?.includes("No data found") || (Array.isArray(reopenData.data) && reopenData.data.length === 0)) {
            setReopenCountData("NO_DATA");
          } else if (reopenData.data && Array.isArray(reopenData.data) && reopenData.data.length > 0) {
            setReopenCountData(reopenData.data);
          } else {
            const defaultData = [
              { reopenCount: 2, count: 8, percentage: 88.9 },
              { reopenCount: 4, count: 1, percentage: 11.1 }
            ];
            setReopenCountData(defaultData);
          }
        } else if (reopenData?.error) {
          // Silently handle error
        }

        // Process API Call 8: Defect distribution by type (already fetched in parallel)
        if (defectTypeResponse && !defectTypeResponse.error && defectTypeResponse.data && defectTypeResponse.data.defectTypes && Array.isArray(defectTypeResponse.data.defectTypes)) {
          if (defectTypeResponse.data.defectTypes.length > 0) {
            setDefectTypeData({
              defectTypes: defectTypeResponse.data.defectTypes,
              totalDefectCount: defectTypeResponse.data.totalDefectCount,
              mostCommonDefectType: defectTypeResponse.data.mostCommonDefectType,
              mostCommonDefectCount: defectTypeResponse.data.mostCommonDefectCount
            });
          } else {
            setDefectTypeData("INVALID_DATA");
          }
        } else {
          setDefectTypeData(null);
          // Silently handle error
        }

        // Process API Call 9: Defects by module (already fetched in parallel)
        if (defectsByModuleResponse && !defectsByModuleResponse.error && defectsByModuleResponse.data && Array.isArray(defectsByModuleResponse.data)) {
          if (defectsByModuleResponse.data.length > 0) {
            setDefectsByModuleData(defectsByModuleResponse.data);
          } else {
            setDefectsByModuleData("NO_DATA");
          }
        } else {
          setDefectsByModuleData(null);
          if (defectsByModuleResponse?.error) {
            // Silently handle error
            setDefectsByModuleError(true);
          }
        }

      } catch (error) {
        // Silently handle error
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [selectedProjectTab]);

  // Helper functions for dynamic project info
  const getProjectRiskFromCardAPI = (projectId: number): 'high' | 'medium' | 'low' => {
    const cardData = projectCardData[projectId];

    if (!cardData || !cardData.availableRiskLevels || cardData.availableRiskLevels.length === 0) {
      return 'medium';
    }

    // Get the highest risk level from availableRiskLevels
    const riskLevels = cardData.availableRiskLevels;

    if (riskLevels.includes('High')) {
      return 'high';
    } else if (riskLevels.includes('Medium')) {
      return 'medium';
    } else if (riskLevels.includes('Low')) {
      return 'low';
    } else {
      return 'medium'; // Default fallback
    }
  };

  const getRiskLevel = () => {
    // Get risk from project card API data
    const risk = getProjectRiskFromCardAPI(selectedProjectTab);

    switch (risk) {
      case 'high': return 'High Risk';
      case 'low': return 'Low Risk';
      case 'medium': return 'Medium Risk';
      default: return 'Medium Risk';
    }
  };

  const getRiskColor = () => {
    // Determine color based on project card API risk
    const risk = getProjectRiskFromCardAPI(selectedProjectTab);

    switch (risk) {
      case 'high': return '#dc2626'; // Red for High Risk
      case 'low': return '#10b981'; // Green for Low Risk
      case 'medium': return '#f59e0b'; // Yellow for Medium Risk
      default: return '#f59e0b'; // Default yellow
    }
  };

  const getSelectedProjectName = () => {
    return allProjects.find(p => p.id === selectedProjectTab)?.projectName || 'Project';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onLogoutPress={onLogoutPress} />
      <ScrollView style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onDashboardPress}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        {/* Project Selection Tabs */}
        <View style={styles.projectSelectionContainer}>
          <Text style={styles.projectSelectionTitle}>Project Selection</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.projectTabsContainer}
          >
            {allProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.projectTab,
                  selectedProjectTab === project.id && styles.selectedProjectTab
                ]}
                onPress={() => setSelectedProjectTab(project.id)}
              >
                <Text style={[
                  styles.projectTabText,
                  selectedProjectTab === project.id && styles.selectedProjectTabText
                ]}>
                  {project.projectName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Project Header */}
        <View style={styles.defectTrackerHeader}>
          <Text style={styles.defectTrackerTitle}>{getSelectedProjectName()}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getRiskColor() }
          ]}>
            <Text style={styles.statusBadgeText}>{getRiskLevel()}</Text>
          </View>
        </View>

        {/* Defect Severity Summary */}
        <View style={styles.defectSeverityContainer}>
          <Text style={styles.sectionTitle}>Defect Severity</Text>
          <View style={styles.severitySummary}>
            <View style={styles.severityItem}>
              <View style={[styles.severityDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.severityText}>High: {severitySummary?.high?.total || 0}</Text>
            </View>
            <View style={styles.severityItem}>
              <View style={[styles.severityDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.severityText}>Medium: {severitySummary?.medium?.total || 0}</Text>
            </View>
            <View style={styles.severityItem}>
              <View style={[styles.severityDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.severityText}>Low: {severitySummary?.low?.total || 0}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewChartButton}
            onPress={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          >
            <Text style={styles.viewChartText}>
              {showDetailedBreakdown ? 'Hide Chart' : 'View Chart'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Breakdown Table (shown when View Chart is clicked) */}
        {showDetailedBreakdown && (
          <View style={styles.detailedBreakdownContainer}>
            <Text style={styles.sectionTitle}>Defect Severity Breakdown</Text>

            {/* API Integration - Show loading or data */}
            {severitySummary ? (
              <>
                {/* Debug logs moved to useEffect */}

                {/* Top Row: Low (left) and Medium (right) */}
                <View style={styles.topRowContainer}>
                  {/* Low Severity */}
                  <View style={[styles.severityCard, styles.lowSeverityCard, styles.halfWidthCard]}>
                    <Text style={styles.severityCardTitle}>Defects on Low</Text>
                    <Text style={styles.severityCardTotal}>Total: {severitySummary.low?.total || 0}</Text>
                    <View style={styles.severityStats}>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#f92309' }]} />
                        <Text style={styles.statText}>REOPEN: {severitySummary.low?.statuses?.REOPEN?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#443eda' }]} />
                        <Text style={styles.statText}>NEW: {severitySummary.low?.statuses?.NEW?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#e4c73e' }]} />
                        <Text style={styles.statText}>OPEN: {severitySummary.low?.statuses?.OPEN?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#57dc1e' }]} />
                        <Text style={styles.statText}>FIXED: {severitySummary.low?.statuses?.FIXED?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#676363' }]} />
                        <Text style={styles.statText}>DUPLICATE: {severitySummary.low?.statuses?.DUPLICATE?.count || 0}</Text>
                      </View>
                    </View>
                <TouchableOpacity
                  style={styles.viewChartButton}
                  onPress={() => setSelectedSeverityChart(selectedSeverityChart === 'low' ? null : 'low')}
                >
                  <Text style={styles.viewChartText}>
                    {selectedSeverityChart === 'low' ? 'Hide Chart' : 'View Chart'}
                  </Text>
                </TouchableOpacity>
              </View>

                  {/* Medium Severity */}
                  <View style={[styles.severityCard, styles.mediumSeverityCard, styles.halfWidthCard]}>
                    <Text style={styles.severityCardTitle}>Defects on Medium</Text>
                    <Text style={styles.severityCardTotal}>Total: {severitySummary.medium?.total || 0}</Text>
                    <View style={styles.severityStats}>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#f92309' }]} />
                        <Text style={styles.statText}>REOPEN: {severitySummary.medium?.statuses?.REOPEN?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#443eda' }]} />
                        <Text style={styles.statText}>NEW: {severitySummary.medium?.statuses?.NEW?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#e4c73e' }]} />
                        <Text style={styles.statText}>OPEN: {severitySummary.medium?.statuses?.OPEN?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#57dc1e' }]} />
                        <Text style={styles.statText}>FIXED: {severitySummary.medium?.statuses?.FIXED?.count || 0}</Text>
                      </View>
                      <View style={styles.statRow}>
                        <View style={[styles.statDot, { backgroundColor: '#676363' }]} />
                        <Text style={styles.statText}>DUPLICATE: {severitySummary.medium?.statuses?.DUPLICATE?.count || 0}</Text>
                      </View>
                    </View>
                <TouchableOpacity
                  style={styles.viewChartButton}
                  onPress={() => setSelectedSeverityChart(selectedSeverityChart === 'medium' ? null : 'medium')}
                >
                  <Text style={styles.viewChartText}>
                    {selectedSeverityChart === 'medium' ? 'Hide Chart' : 'View Chart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

                {/* Bottom Row: High (full width) */}
                <View style={styles.bottomRowContainer}>
                  <View style={[styles.severityCard, styles.highSeverityCard, styles.fullWidthCard]}>
                    <Text style={styles.severityCardTitle}>Defects on High</Text>
                    <Text style={styles.severityCardTotal}>Total: {severitySummary.high?.total || 0}</Text>

                    {/* Two Column Layout for High Defect Stats */}
                    <View style={styles.highDefectStatsContainer}>
                      {/* Left Column */}
                      <View style={styles.highDefectColumn}>
                        <View style={styles.statRow}>
                          <View style={[styles.statDot, { backgroundColor: '#f92309' }]} />
                          <Text style={styles.statText}>REOPEN: {severitySummary.high?.statuses?.REOPEN?.count || 0}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <View style={[styles.statDot, { backgroundColor: '#443eda' }]} />
                          <Text style={styles.statText}>NEW: {severitySummary.high?.statuses?.NEW?.count || 0}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <View style={[styles.statDot, { backgroundColor: '#e4c73e' }]} />
                          <Text style={styles.statText}>OPEN: {severitySummary.high?.statuses?.OPEN?.count || 0}</Text>
                        </View>
                  </View>

                      {/* Right Column */}
                      <View style={styles.highDefectColumn}>
                        <View style={styles.statRow}>
                          <View style={[styles.statDot, { backgroundColor: '#57dc1e' }]} />
                          <Text style={styles.statText}>FIXED: {severitySummary.high?.statuses?.FIXED?.count || 0}</Text>
                        </View>
                        <View style={styles.statRow}>
                          <View style={[styles.statDot, { backgroundColor: '#676363' }]} />
                          <Text style={styles.statText}>DUPLICATE: {severitySummary.high?.statuses?.DUPLICATE?.count || 0}</Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.viewChartButton}
                      onPress={() => setSelectedSeverityChart(selectedSeverityChart === 'high' ? null : 'high')}
                    >
                      <Text style={styles.viewChartText}>
                        {selectedSeverityChart === 'high' ? 'Hide Chart' : 'View Chart'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.severityText}>Loading severity data...</Text>
            )}
          </View>
        )}

        {/* Severity Pie Chart - Show when a severity level is selected */}
        {selectedSeverityChart && severitySummary && severitySummary[selectedSeverityChart] && (
          <View style={styles.severityChartContainer}>
            <SeverityPieChart
              data={severitySummary[selectedSeverityChart]}
              severityLevel={selectedSeverityChart}
              size={220}
            />
          </View>
        )}

        {/* Statistics Cards - Top Row */}
        <View style={styles.statsTopRow}>
          {/* Defect Density */}
          <View style={styles.statCard}>
            <GaugeChart
              value={defectStats.density}
              title="Defect Density"
              size={180}
            />
          </View>

          {/* Defect Severity Index */}
          <View style={styles.statCard}>
            <Text style={styles.statCardTitle}>Defect Severity Index</Text>

            {/* Thermometer */}
            <View style={styles.thermometerContainer}>
              {/* Scale Labels */}
              <View style={styles.thermometerScale}>
                <Text style={styles.scaleLabel}>100</Text>
                <Text style={styles.scaleLabel}>75</Text>
                <Text style={styles.scaleLabel}>50</Text>
                <Text style={styles.scaleLabel}>25</Text>
                <Text style={styles.scaleLabel}>0</Text>
              </View>

              {/* Thermometer Body */}
              <View style={styles.thermometerBody}>
                {/* Background tube */}
                <View style={styles.thermometerTube}>
                  {/* Dynamic fill based on DSI percentage */}
                  <View style={[
                    styles.thermometerFill,
                    {
                      height: `${Math.min(Math.max(defectStats.severityIndex, 0), 100)}%`,
                      backgroundColor:
                        defectStats.severityIndex > 75 ? '#dc2626' : // Red
                        defectStats.severityIndex > 50 ? '#2563eb' : // Blue
                        defectStats.severityIndex > 25 ? '#fbbf24' : // Yellow
                        '#10b981' // Green
                    }
                  ]} />
                </View>

                {/* Thermometer bulb at bottom */}
                <View style={[
                  styles.thermometerBulb,
                  {
                    backgroundColor:
                      defectStats.severityIndex > 75 ? '#dc2626' : // Red
                      defectStats.severityIndex > 50 ? '#2563eb' : // Blue
                      defectStats.severityIndex > 25 ? '#fbbf24' : // Yellow
                      '#10b981' // Green
                  }
                ]} />
              </View>

              {/* Value Display */}
              <View style={styles.thermometerValue}>
                <Text style={[
                  styles.severityValue,
                  {
                    color:
                      defectStats.severityIndex > 75 ? '#dc2626' : // Red
                      defectStats.severityIndex > 50 ? '#2563eb' : // Blue
                      defectStats.severityIndex > 25 ? '#fbbf24' : // Yellow
                      '#10b981' // Green
                  }
                ]}>{defectStats.severityIndex}</Text>
              </View>
            </View>

            <Text style={styles.statCardSubtext}>Weighted severity score (higher = more severe defects)</Text>
          </View>
        </View>

        {/* Statistics Cards - Bottom Row */}
        <View style={styles.statsBottomRow}>
          {/* Defect to Remark Ratio */}
          <View style={styles.statCardFullWidth}>
            <Text style={styles.statCardTitle}>Defect to Remark Ratio</Text>
            {remarkRatioError ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Failed to load defect to remark ratio</Text>
              </View>
            ) : (
              <View style={styles.remarkRatioContainer}>
                <Text style={styles.remarkRatioValue}>{defectStats.remarkRatio}%</Text>
                <Text style={styles.remarkRatioSubtext}>Defect Remark Ratio (%)</Text>
                <View style={[
                  styles.remarkRatioBadge,
                  {
                    backgroundColor:
                      defectStats.remarkColor === 'green' ? '#10b981' :
                      defectStats.remarkColor === 'yellow' ? '#fbbf24' :
                      defectStats.remarkColor === 'blue' ? '#2563eb' :
                      defectStats.remarkColor === 'red' ? '#dc2626' :
                      '#10b981' // Default green
                  }
                ]}>
                  <Text style={styles.remarkRatioBadgeText}>{defectStats.remarkCategory}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Chart Placeholders */}
        <View style={styles.chartsRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Defects Reopened Multiple Times</Text>

            {/* Check if API returned "No data found" */}
            {reopenCountData === "NO_DATA" ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data available.</Text>
              </View>
            ) : (
              <>
                {/* Dynamic Pie Chart */}
                <View style={styles.pieChartContainer}>
                  <DynamicPieChart
                    data={reopenCountData && Array.isArray(reopenCountData) ?
                      (() => {
                        // Calculate total for percentages
                        const total = reopenCountData.reduce((sum, item) => sum + item.count, 0);

                        return reopenCountData.map(item => ({
                          defectType: item.label || `${item.reopenCount} times`,
                          defectCount: item.count,
                          percentage: total > 0 ? ((item.count / total) * 100) : 0
                        }));
                      })() : []
                    }
                    size={140}
                    strokeWidth={2}
                  />
                </View>

                {/* Dynamic Legend */}
                <View style={styles.pieChartLegend}>
                  {reopenCountData && Array.isArray(reopenCountData) && reopenCountData.length > 0 ? (
                    // Dynamic legend from API data with matching colors
                    (() => {
                      const getColor = (index: number): string => {
                        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280'];
                        return colors[index % colors.length];
                      };

                      // Calculate total for percentages
                      const total = reopenCountData.reduce((sum: number, item: any) => sum + item.count, 0);

                      return reopenCountData.map((item: any, index: number) => {
                        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                        return (
                          <View key={index} style={styles.pieChartLegendItem}>
                            <View style={[
                              styles.pieChartLegendDot,
                              { backgroundColor: getColor(index) }
                            ]} />
                            <Text style={styles.pieChartLegendText}>
                              {item.label || `${item.reopenCount} times`}: {item.count} ({percentage}%)
                            </Text>
                          </View>
                        );
                      });
                    })()
                  ) : (
                    // Fallback legend
                    <>
                      <View style={styles.pieChartLegendItem}>
                        <View style={[styles.pieChartLegendDot, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.pieChartLegendText}>2 times: 8 (88.9%)</Text>
                      </View>
                      <View style={styles.pieChartLegendItem}>
                        <View style={[styles.pieChartLegendDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={styles.pieChartLegendText}>4 times: 1 (11.1%)</Text>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}
          </View>


        </View>

        {/* Defect Distribution by Type - Separate Row */}
        <View style={styles.singleChartRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Defect Distribution by Type</Text>

            {/* Check if API returned "No defects found" or "No data found" */}
            {defectTypeData === "INVALID_DATA" ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Invalid defect type data</Text>
              </View>
            ) : defectTypeData === "NO_DATA" ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data available.</Text>
              </View>
            ) : (
              <>
                {/* Dynamic Multi-Color Pie Chart */}
                <View style={styles.multiPieChartContainer}>
                  <DynamicPieChart
                    data={defectTypeData && defectTypeData.defectTypes ? defectTypeData.defectTypes : []}
                    size={140}
                    strokeWidth={2}
                  />
                </View>

                {/* Dynamic Legend */}
                <View style={styles.multiPieChartLegend}>
                  {defectTypeData && defectTypeData.defectTypes && Array.isArray(defectTypeData.defectTypes) && defectTypeData.defectTypes.length > 0 ? (
                    // Dynamic legend from API data with matching colors
                    (() => {
                      const getColor = (index: number): string => {
                        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280'];
                        return colors[index % colors.length];
                      };

                      const renderLegendRows = () => {
                        const rows = [];
                        for (let i = 0; i < defectTypeData.defectTypes.length; i += 2) {
                          const rowItems = defectTypeData.defectTypes.slice(i, i + 2);
                          rows.push(
                            <View key={i} style={styles.legendRow}>
                              {rowItems.map((item: any, rowIndex: number) => (
                                <View key={i + rowIndex} style={styles.multiLegendItem}>
                                  <View style={[
                                    styles.multiLegendDot,
                                    { backgroundColor: getColor(i + rowIndex) }
                                  ]} />
                                  <Text style={styles.multiLegendText}>
                                    {item.defectType}: {item.defectCount} ({item.percentage.toFixed(1)}%)
                                  </Text>
                                </View>
                              ))}
                            </View>
                          );
                        }
                        return rows;
                      };

                      return renderLegendRows();
                    })()
                  ) : (
                    // Default legend
                    <>
                      <View style={styles.legendRow}>
                        <View style={styles.multiLegendItem}>
                          <View style={[styles.multiLegendDot, { backgroundColor: '#3b82f6' }]} />
                          <Text style={styles.multiLegendText}>Functionality: 236 (52.8%)</Text>
                        </View>
                        <View style={styles.multiLegendItem}>
                          <View style={[styles.multiLegendDot, { backgroundColor: '#ef4444' }]} />
                          <Text style={styles.multiLegendText}>Validation: 100 (22.4%)</Text>
                        </View>
                      </View>
                      <View style={styles.legendRow}>
                        <View style={styles.multiLegendItem}>
                          <View style={[styles.multiLegendDot, { backgroundColor: '#10b981' }]} />
                          <Text style={styles.multiLegendText}>UI: 81 (18.1%)</Text>
                        </View>
                        <View style={styles.multiLegendItem}>
                          <View style={[styles.multiLegendDot, { backgroundColor: '#f59e0b' }]} />
                          <Text style={styles.multiLegendText}>Usability: 30 (6.7%)</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </>
            )}

            {/* Summary Stats - Only show when data is valid */}
            {defectTypeData !== "INVALID_DATA" && (
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {defectTypeData && defectTypeData.totalDefectCount ? defectTypeData.totalDefectCount : 447}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Defects</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>
                    {defectTypeData && defectTypeData.mostCommonDefectCount ? defectTypeData.mostCommonDefectCount : 236}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    Most Common: {defectTypeData && defectTypeData.mostCommonDefectType ? defectTypeData.mostCommonDefectType : 'Functionality'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Additional Charts Section */}
        <View style={styles.additionalChartsSection}>
          {/* Time Charts Row */}
          <View style={styles.timeChartsRow}>
            {/* Time to Find Defects */}
            <View style={styles.timeChartCard}>
              <Text style={styles.timeChartTitle}>Time to Find Defects</Text>
              <View style={styles.lineChartContainer}>
                <View style={styles.yAxisLabels}>
                  <Text style={styles.axisLabel}>4</Text>
                  <Text style={styles.axisLabel}>3</Text>
                  <Text style={styles.axisLabel}>2</Text>
                  <Text style={styles.axisLabel}>1</Text>
                  <Text style={styles.axisLabel}>0</Text>
                </View>
                <View style={styles.lineChartArea}>
                  <View style={styles.lineChartPlaceholder}>
                    <Text style={styles.lineChartText}>📈 Line Chart</Text>
                  </View>
                  <View style={styles.xAxisLabels}>
                    <Text style={styles.xAxisLabel}>Day 1</Text>
                    <Text style={styles.xAxisLabel}>Day 2</Text>
                    <Text style={styles.xAxisLabel}>Day 3</Text>
                    <Text style={styles.xAxisLabel}>Day 4</Text>
                    <Text style={styles.xAxisLabel}>Day 5</Text>
                    <Text style={styles.xAxisLabel}>Day 6</Text>
                    <Text style={styles.xAxisLabel}>Day 7</Text>
                    <Text style={styles.xAxisLabel}>Day 8</Text>
                    <Text style={styles.xAxisLabel}>Day 10</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.chartAxisTitle}>Time (Day)</Text>
            </View>

            {/* Time to Fix Defects */}
            <View style={styles.timeChartCard}>
              <Text style={styles.timeChartTitle}>Time to Fix Defects</Text>
              <View style={styles.lineChartContainer}>
                <View style={styles.yAxisLabels}>
                  <Text style={styles.axisLabel}>4</Text>
                  <Text style={styles.axisLabel}>3</Text>
                  <Text style={styles.axisLabel}>2</Text>
                  <Text style={styles.axisLabel}>1</Text>
                  <Text style={styles.axisLabel}>0</Text>
                </View>
                <View style={styles.lineChartArea}>
                  <View style={styles.lineChartPlaceholder}>
                    <Text style={styles.lineChartText}>📈 Line Chart</Text>
                  </View>
                  <View style={styles.xAxisLabels}>
                    <Text style={styles.xAxisLabel}>Day 1</Text>
                    <Text style={styles.xAxisLabel}>Day 2</Text>
                    <Text style={styles.xAxisLabel}>Day 3</Text>
                    <Text style={styles.xAxisLabel}>Day 4</Text>
                    <Text style={styles.xAxisLabel}>Day 5</Text>
                    <Text style={styles.xAxisLabel}>Day 6</Text>
                    <Text style={styles.xAxisLabel}>Day 7</Text>
                    <Text style={styles.xAxisLabel}>Day 8</Text>
                    <Text style={styles.xAxisLabel}>Day 10</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.chartAxisTitle}>Time (Day)</Text>
            </View>
          </View>

          {/* Defects by Module Chart */}
          <View style={styles.moduleChartContainer}>
            <Text style={styles.moduleChartTitle}>Defects by Module</Text>

            {/* Check for errors or no data */}
            {defectsByModuleError ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Failed to load defects by module</Text>
              </View>
            ) : defectsByModuleData === "NO_DATA" ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data available.</Text>
              </View>
            ) : (
              <View style={styles.moduleChartContent}>
                {/* Dynamic Pie Chart */}
                <View style={styles.pieChartContainer}>
                  <DynamicPieChart
                    data={defectsByModuleData && Array.isArray(defectsByModuleData) ?
                      (() => {
                        // Calculate total for percentages
                        const total = defectsByModuleData.reduce((sum, item) => sum + (item.value || item.defectCount || item.count || 0), 0);

                        return defectsByModuleData.map(item => ({
                          defectType: item.name || item.moduleName || item.module || 'Unknown Module',
                          defectCount: item.value || item.defectCount || item.count || 0,
                          percentage: total > 0 ? (((item.value || item.defectCount || item.count || 0) / total) * 100) : 0
                        }));
                      })() : []
                    }
                    size={140}
                    strokeWidth={2}
                  />
                </View>

                {/* Dynamic Legend */}
                <View style={styles.legendContainer}>
                  {defectsByModuleData && Array.isArray(defectsByModuleData) && defectsByModuleData.length > 0 ? (
                    (() => {
                      const getColor = (index: number): string => {
                        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280'];
                        return colors[index % colors.length];
                      };

                      // Calculate total for percentages
                      const total = defectsByModuleData.reduce((sum: number, item: any) => sum + (item.value || item.defectCount || item.count || 0), 0);

                      return defectsByModuleData.map((item: any, index: number) => {
                        const count = item.value || item.defectCount || item.count || 0;
                        const percentage = total > 0 ? ((count / total) * 100).toFixed(2) : '0.00';
                        const moduleName = item.name || item.moduleName || item.module || 'Unknown Module';

                        return (
                          <View key={index} style={styles.legendItem}>
                            <View style={[
                              styles.legendDot,
                              { backgroundColor: getColor(index) }
                            ]} />
                            <Text style={styles.legendText}>{moduleName}</Text>
                            <Text style={styles.legendValue}>{count} ({percentage}%)</Text>
                          </View>
                        );
                      });
                    })()
                  ) : (
                    // Fallback legend when no API data
                    <>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4285f4' }]} />
                        <Text style={styles.legendText}>Configurations</Text>
                        <Text style={styles.legendValue}>77 (17.30%)</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#34a853' }]} />
                        <Text style={styles.legendText}>Project Management</Text>
                        <Text style={styles.legendValue}>50 (11.24%)</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#fbbc04' }]} />
                        <Text style={styles.legendText}>Bench</Text>
                        <Text style={styles.legendValue}>56 (12.58%)</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
      <Footer
        activeTab="dashboard"
        onDashboardPress={onDashboardPress}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  backButton: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignSelf: 'flex-start',
    elevation: 2,
  },
  backButtonText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },

  // Project Selection
  projectSelectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  projectSelectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  projectTabsContainer: { flexDirection: 'row' },
  projectTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedProjectTab: { backgroundColor: '#3b82f6' },
  projectTabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  selectedProjectTabText: { color: '#fff' },

  // Defect Tracker Header
  defectTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  defectTrackerTitle: { fontSize: 24, fontWeight: 'bold', color: '#222' },
  statusBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Section Title
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16 },

  // Defect Severity Summary
  defectSeverityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  severitySummary: {
    marginBottom: 16,
  },
  severityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  severityText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },

  // Detailed Breakdown Container
  detailedBreakdownContainer: {
    marginBottom: 24,
  },

  // Layout Containers
  topRowContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8, // Equal spacing between cards
  },
  bottomRowContainer: {
    marginBottom: 24,
  },

  // Severity Cards
  severityCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  severityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    borderWidth: 2,
  },
  halfWidthCard: {
    flex: 1, // Equal flex distribution
  },
  fullWidthCard: {
    width: '100%',
  },
  highSeverityCard: { borderColor: '#dc2626' },
  mediumSeverityCard: { borderColor: '#f59e0b' },
  lowSeverityCard: { borderColor: '#10b981' },
  severityCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  severityCardTotal: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  severityStats: { marginBottom: 12 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statText: { fontSize: 11, color: '#666', flex: 1 },

  // High Defect Two-Column Layout
  highDefectStatsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16, // Space between left and right columns
  },
  highDefectColumn: {
    flex: 1, // Equal width for both columns
  },
  viewChartButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewChartText: { fontSize: 12, color: '#3b82f6', fontWeight: '600' },

  // Severity Chart Container
  severityChartContainer: {
    marginVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
  },

  // Stats Rows
  statsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statsBottomRow: {
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    alignItems: 'center',
  },
  statCardFullWidth: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    alignItems: 'center',
    width: '100%',
  },
  statCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 8, textAlign: 'center' },
  statCardValue: { fontSize: 24, fontWeight: 'bold', color: '#3b82f6', marginBottom: 8 },
  statCardSubtext: { fontSize: 11, color: '#666', textAlign: 'center', marginTop: 8 },

  // Defect Density Gauge
  defectDensityContainer: {
    alignItems: 'center',
  },
  defectDensityLabel: {
    fontSize: 14,
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  defectDensityValue: {
    fontWeight: 'bold',
    color: '#dc2626',
  },

  // Full Semicircular Gauge with 3 colors
  fullSemicircularGauge: {
    position: 'relative',
    width: 120,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  gaugeCircle: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  // Green section (0-7) - approximately 35% of semicircle
  greenSection: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 33,
    height: 100,
    backgroundColor: '#10b981', // Green
  },
  // Yellow section (7-13) - approximately 30% of semicircle
  yellowSection: {
    position: 'absolute',
    left: 33,
    top: 0,
    width: 34,
    height: 100,
    backgroundColor: '#f59e0b', // Yellow
  },
  // Red section (13-20) - approximately 35% of semicircle
  redSection: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 33,
    height: 100,
    backgroundColor: '#dc2626', // Red
  },
  // Inner white circle creates the gauge thickness
  innerWhiteCircle: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
  },
  // Hide bottom half to create semicircle
  bottomHide: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 102,
    height: 52,
    backgroundColor: '#fff',
  },
  // Needle assembly
  needleAssembly: {
    position: 'absolute',
    bottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleArm: {
    width: 2,
    height: 40, // Length to reach the colored arc (gauge radius 50 - inner radius 40 = 10px thick arc)
    backgroundColor: '#333',
    borderRadius: 1,
    transform: [{ rotate: '25deg' }], // Point to 10.12 (in yellow zone)
    transformOrigin: 'bottom center',
  },
  needlePivot: {
    position: 'absolute',
    bottom: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  // Scale labels
  gaugeScale: {
    position: 'absolute',
    bottom: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  leftScale: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  rightScale: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Remark Ratio
  remarkRatioContainer: { alignItems: 'center' },
  remarkRatioValue: { fontSize: 28, fontWeight: 'bold', color: '#222' },
  remarkRatioSubtext: { fontSize: 11, color: '#666', marginVertical: 4 },
  remarkRatioBadge: {
    // backgroundColor is now set dynamically via inline styles
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  remarkRatioBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // New Remark Ratio Styles
  remarkRatioLargeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 8,
  },
  remarkRatioSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  remarkRatioStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: 'center',
  },
  remarkRatioStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  remarkRatioProgressContainer: {
    marginTop: 8,
  },
  remarkRatioProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  remarkRatioProgressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  remarkRatioScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  remarkRatioScaleLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },

  // Charts
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  singleChartRow: {
    marginBottom: 24,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 12, textAlign: 'center' },
  chartPlaceholder: {
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: { fontSize: 12, color: '#666' },

  // Additional Charts Section
  additionalChartsSection: {
    marginBottom: 24,
  },

  // Time Charts
  timeChartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  timeChartCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  timeChartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  lineChartContainer: {
    flexDirection: 'row',
    height: 120,
    marginBottom: 8,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginRight: 8,
    width: 20,
  },
  axisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  lineChartArea: {
    flex: 1,
  },
  lineChartPlaceholder: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lineChartText: {
    fontSize: 12,
    color: '#666',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  xAxisLabel: {
    fontSize: 9,
    color: '#666',
    transform: [{ rotate: '-45deg' }],
  },
  chartAxisTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },

  // Module Chart (Pie Chart with Legend)
  moduleChartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  moduleChartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  moduleChartContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pieChartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pieChartText: {
    fontSize: 14,
    color: '#666',
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 12,
    color: '#222',
  },
  legendValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },

  // Thermometer Styles
  thermometerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: 16,
    height: 120,
  },
  thermometerScale: {
    justifyContent: 'space-between',
    height: 100,
    marginRight: 8,
    marginBottom: 20, // Move scale labels up to align with thermometer tube
    paddingVertical: 2, // Add small padding for precise alignment
  },
  scaleLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  thermometerBody: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'flex-end',
  },
  thermometerTube: {
    width: 12,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end', // Ensure fill starts from bottom
  },
  thermometerFill: {
    width: '100%',
    // height is now set dynamically via inline styles
    backgroundColor: '#fbbf24', // Yellow color
    borderRadius: 6,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  thermometerBulb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fbbf24', // Yellow color matching the fill
    marginTop: -2,
  },
  thermometerValue: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b', // Yellow color
  },

  // Pie Chart Styles
  exactPieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    backgroundColor: '#3b82f6', // Blue background (80%)
    overflow: 'hidden',
  },
  blueSection80: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6', // Blue (80%)
    position: 'absolute',
  },
  yellowSection20: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: 60, // Center of circle
    left: 60, // Center of circle
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderTopWidth: 60,
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: '#fbbf24', // Yellow slice (20%)
    borderTopColor: '#fbbf24', // Yellow slice (20%)
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-54deg' }], // 20% of 360° = 72°, positioned correctly
    transformOrigin: '0 0',
  },
  pieChartLegend: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  pieChartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  pieChartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pieChartLegendText: {
    fontSize: 11,
    color: '#666',
  },

  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  // Dynamic Pie Chart Styles
  dynamicPieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    backgroundColor: '#3b82f6', // Default blue background
    overflow: 'hidden',
  },
  pieChartSegment: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  yellowSegmentDynamic: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: 60,
    left: 60,
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderTopWidth: 60,
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: '#fbbf24',
    borderTopColor: '#fbbf24',
    borderBottomColor: 'transparent',
    transformOrigin: '0 0',
  },

  // Multi-Color Pie Chart Styles
  multiPieChartContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  fourColorPieChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'relative',
    overflow: 'hidden',
  },
  // Functionality: 236 (52.8%) - Blue - More than half circle
  functionalityPie: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
    transform: [{ rotate: '0deg' }],
  },
  // Validation: 100 (22.4%) - Red - Quarter section
  validationPie: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: 70,
    left: 70,
    borderLeftWidth: 0,
    borderRightWidth: 70,
    borderTopWidth: 70,
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: '#ef4444',
    borderTopColor: '#ef4444',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '10deg' }],
    transformOrigin: '0 0',
  },
  // UI: 81 (18.1%) - Green - Smaller section
  uiPie: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: 70,
    left: 70,
    borderLeftWidth: 0,
    borderRightWidth: 70,
    borderTopWidth: 0,
    borderBottomWidth: 70,
    borderLeftColor: 'transparent',
    borderRightColor: '#10b981',
    borderTopColor: 'transparent',
    borderBottomColor: '#10b981',
    transform: [{ rotate: '0deg' }],
    transformOrigin: '0 0',
  },
  // Usability: 30 (6.7%) - Yellow - Smallest section
  usabilityPie: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: 70,
    left: 70,
    borderLeftWidth: 70,
    borderRightWidth: 0,
    borderTopWidth: 70,
    borderBottomWidth: 0,
    borderLeftColor: '#f59e0b',
    borderRightColor: 'transparent',
    borderTopColor: '#f59e0b',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '0deg' }],
    transformOrigin: '0 0',
  },
  multiPieChartLegend: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  multiLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  multiLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  multiLegendText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ProjectDetailScreen;
