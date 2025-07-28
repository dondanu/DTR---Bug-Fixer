import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions
} from 'react-native';
import Header from './Header';
import Footer from './Footer';
import { getDefectSeverityIndex } from '../api/dsi';

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
    remarkRatio: 97.75
  });
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [severitySummary, setSeveritySummary] = useState<any>(null);

  // Debug: Log whenever severitySummary changes
  useEffect(() => {
    console.log('🔄 SEVERITY SUMMARY STATE CHANGED:', severitySummary);
    if (severitySummary) {
      console.log('🔄 LOW DATA IN STATE:', severitySummary.low);
      console.log('🔄 MEDIUM DATA IN STATE:', severitySummary.medium);
      console.log('🔄 HIGH DATA IN STATE:', severitySummary.high);
    }
  }, [severitySummary]);

  useEffect(() => {
    // Fetch all projects for the project selection tabs
    const fetchAllProjects = async () => {
      try {
        const projectsUrl = 'http://34.56.162.48:8087/api/v1/projects';
        console.log('🔥 API Request Details:');
        console.log('Request URL:', projectsUrl);
        console.log('Request Method: GET');
        console.log('Referrer Policy: strict-origin-when-cross-origin');

        const response = await fetch(projectsUrl);
        console.log('Status Code:', response.status);
        const data = await response.json();
        setAllProjects(data.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchAllProjects();
  }, []);

  useEffect(() => {
    // Fetch project details and defect statistics
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // API Call 1: Fetch defect statistics for selected project
        const defectStatsUrl = `http://34.56.162.48:8087/api/v1/defect-statistics/${selectedProjectTab}`;
        console.log('📊 API Request Details:');
        console.log('Request URL:', defectStatsUrl);
        console.log('Request Method: GET');
        console.log('Referrer Policy: strict-origin-when-cross-origin');

        const statsResponse = await fetch(defectStatsUrl);
        console.log('Status Code:', statsResponse.status);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDefectStats(statsData.data || defectStats);
        }

        // API Call 2: Fetch defects for this project
        const defectsUrl = `http://34.56.162.48:8087/api/v1/defects/project/${selectedProjectTab}`;
        console.log('🐛 API Request Details:');
        console.log('Request URL:', defectsUrl);
        console.log('Request Method: GET');
        console.log('Referrer Policy: strict-origin-when-cross-origin');

        const defectsResponse = await fetch(defectsUrl);
        console.log('Status Code:', defectsResponse.status);
        const defectsData = await defectsResponse.json();
        setDefects(defectsData.data || []);

        // API Call 3: Fetch defect severity summary
        const severitySummaryUrl = `http://34.56.162.48:8087/api/v1/dashboard/defect_severity_summary/${selectedProjectTab}`;
        console.log('📊 API Request Details:');
        console.log('Request URL:', severitySummaryUrl);
        console.log('Request Method: GET');
        console.log('Referrer Policy: strict-origin-when-cross-origin');

        const severityResponse = await fetch(severitySummaryUrl);
        console.log('Status Code:', severityResponse.status);

        if (severityResponse.ok) {
          const severityData = await severityResponse.json();
          console.log('🔍 === COMPLETE API RESPONSE ===');
          console.log('Full Response:', JSON.stringify(severityData, null, 2));
          console.log('🔍 === DEFECT SUMMARY ANALYSIS ===');
          console.log('Defect Summary Array Length:', severityData.data?.defectSummary?.length);
          console.log('Total Defects:', severityData.data?.totalDefects);
          console.log('Project Name:', severityData.data?.projectName);

          // Transform the API response to match our component structure
          if (severityData.data?.defectSummary) {
            const transformedData = {
              high: {},
              medium: {},
              low: {},
              totalDefects: severityData.data.totalDefects
            };

            // Process each severity level from the API response
            severityData.data.defectSummary.forEach((severityItem: any, index: number) => {
              console.log(`=== SEVERITY ITEM ${index + 1} ===`);
              console.log('Full severity item:', JSON.stringify(severityItem, null, 2));
              console.log('Severity level:', severityItem.severity);
              console.log('All available properties:', Object.keys(severityItem));

              // Log all defect status names and values
              Object.keys(severityItem).forEach(key => {
                if (key !== 'severity') {
                  console.log(`${key}:`, severityItem[key]);
                }
              });
              console.log('=== END SEVERITY ITEM ===');

              const severityLevel = severityItem.severity?.toLowerCase();

              if (severityLevel === 'high') {
                console.log('🔴 TRANSFORMING HIGH SEVERITY DATA:');
                console.log('total:', severityItem.total);

                // Let's use ALL available fields from API instead of hardcoded ones
                const highData: any = { total: severityItem.total || 0 };
                Object.keys(severityItem).forEach(key => {
                  if (key !== 'severity' && key !== 'total') {
                    highData[key] = severityItem[key] || 0;
                    console.log(`HIGH ${key}:`, severityItem[key]);
                  }
                });

                transformedData.high = highData;
                console.log('🔴 HIGH DATA AFTER TRANSFORM:', transformedData.high);

              } else if (severityLevel === 'medium') {
                console.log('🟡 TRANSFORMING MEDIUM SEVERITY DATA:');
                console.log('total:', severityItem.total);

                // Let's use ALL available fields from API instead of hardcoded ones
                const mediumData: any = { total: severityItem.total || 0 };
                Object.keys(severityItem).forEach(key => {
                  if (key !== 'severity' && key !== 'total') {
                    mediumData[key] = severityItem[key] || 0;
                    console.log(`MEDIUM ${key}:`, severityItem[key]);
                  }
                });

                transformedData.medium = mediumData;
                console.log('🟡 MEDIUM DATA AFTER TRANSFORM:', transformedData.medium);

              } else if (severityLevel === 'low') {
                console.log('🟢 TRANSFORMING LOW SEVERITY DATA:');
                console.log('total:', severityItem.total);

                // Let's use ALL available fields from API instead of hardcoded ones
                const lowData: any = { total: severityItem.total || 0 };
                Object.keys(severityItem).forEach(key => {
                  if (key !== 'severity' && key !== 'total') {
                    lowData[key] = severityItem[key] || 0;
                    console.log(`LOW ${key}:`, severityItem[key]);
                  }
                });

                transformedData.low = lowData;
                console.log('🟢 LOW DATA AFTER TRANSFORM:', transformedData.low);
              }
            });

            console.log('🚀 FINAL TRANSFORMED DATA:', JSON.stringify(transformedData, null, 2));
            setSeveritySummary(transformedData);

            // Let's also log what we're setting
            console.log('🎯 SETTING SEVERITY SUMMARY STATE TO:', transformedData);
          }
        } else {
          console.error('Failed to fetch severity summary:', severityResponse.status);
        }

        // API Call 4: Fetch defect severity index
        try {
          console.log('📈 API Request Details:');
          console.log('Request URL: DSI API for project', selectedProjectTab);
          console.log('Request Method: GET');

          const dsiData = await getDefectSeverityIndex(selectedProjectTab);
          console.log('📈 DSI API Response:', JSON.stringify(dsiData, null, 2));

          // Update the defectStats with the real DSI percentage value
          if (dsiData && dsiData.data && typeof dsiData.data.dsiPercentage === 'number') {
            setDefectStats(prevStats => ({
              ...prevStats,
              severityIndex: dsiData.data.dsiPercentage
            }));
            console.log('✅ DSI Percentage updated to:', dsiData.data.dsiPercentage + '%');
          } else {
            console.log('⚠️ DSI data not in expected format:', dsiData);
            console.log('Expected dsiPercentage field, got:', dsiData?.data);
            console.log('Available fields in response:', dsiData?.data ? Object.keys(dsiData.data) : 'No data object');
          }
        } catch (dsiError) {
          console.error('Error fetching DSI:', dsiError);
          console.log('🔄 Keeping default DSI value');
        }

      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [selectedProjectTab]);

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

        {/* Defect Tracker Header */}
        <View style={styles.defectTrackerHeader}>
          <Text style={styles.defectTrackerTitle}>Defect Tracker</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>High Risk</Text>
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
                {console.log('🎯 RENDERING WITH SEVERITY SUMMARY:', severitySummary)}
                {console.log('🎯 LOW DATA IN RENDER:', severitySummary.low)}
                {console.log('🎯 MEDIUM DATA IN RENDER:', severitySummary.medium)}
                {console.log('🎯 HIGH DATA IN RENDER:', severitySummary.high)}

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
                <TouchableOpacity style={styles.viewChartButton}>
                  <Text style={styles.viewChartText}>View Chart</Text>
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
                <TouchableOpacity style={styles.viewChartButton}>
                  <Text style={styles.viewChartText}>View Chart</Text>
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

                    <TouchableOpacity style={styles.viewChartButton}>
                      <Text style={styles.viewChartText}>View Chart</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.severityText}>Loading severity data...</Text>
            )}
          </View>
        )}

        {/* Statistics Cards - Top Row */}
        <View style={styles.statsTopRow}>
          {/* Defect Density */}
          <View style={styles.statCard}>
            <Text style={styles.statCardTitle}>Defect Density</Text>
            <View style={styles.defectDensityContainer}>
              <Text style={styles.defectDensityLabel}>Defect Density: <Text style={styles.defectDensityValue}>{defectStats.density}</Text></Text>

              {/* Full Semicircular Gauge Meter */}
              <View style={styles.fullSemicircularGauge}>
                {/* Complete Semicircle with 3 colors */}
                <View style={styles.gaugeCircle}>
                  {/* Green Section (0-7) - Left third */}
                  <View style={styles.greenSection} />
                  {/* Yellow Section (7-13) - Middle third */}
                  <View style={styles.yellowSection} />
                  {/* Red Section (13-20) - Right third */}
                  <View style={styles.redSection} />

                  {/* Inner white circle to create gauge thickness */}
                  <View style={styles.innerWhiteCircle} />

                  {/* Bottom white rectangle to hide bottom half */}
                  <View style={styles.bottomHide} />
                </View>

                {/* Needle pointing to 10.12 */}
                <View style={styles.needleAssembly}>
                  <View style={styles.needleArm} />
                  <View style={styles.needlePivot} />
                </View>

                {/* Scale numbers */}
                <View style={styles.gaugeScale}>
                  <Text style={styles.leftScale}>0</Text>
                  <Text style={styles.rightScale}>20</Text>
                </View>
              </View>
            </View>
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
            <View style={styles.remarkRatioContainer}>
              <Text style={styles.remarkRatioValue}>{defectStats.remarkRatio}%</Text>
              <Text style={styles.remarkRatioSubtext}>Defect Remark Ratio (%)</Text>
              <View style={styles.remarkRatioBadge}>
                <Text style={styles.remarkRatioBadgeText}>Medium</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chart Placeholders */}
        <View style={styles.chartsRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Defects Reopened Multiple Times</Text>

            {/* Pie Chart */}
            <View style={styles.pieChartContainer}>
              {/* Exact Pie Chart Structure */}
              <View style={styles.exactPieChart}>
                {/* Blue section (80%) - using clip path simulation */}
                <View style={styles.blueSection80} />
                {/* Yellow section (20%) - top right wedge */}
                <View style={styles.yellowSection20} />
              </View>
            </View>

            {/* Legend */}
            <View style={styles.pieChartLegend}>
              <View style={styles.pieChartLegendItem}>
                <View style={[styles.pieChartLegendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.pieChartLegendText}>2 times: 4 (80.0%)</Text>
              </View>
              <View style={styles.pieChartLegendItem}>
                <View style={[styles.pieChartLegendDot, { backgroundColor: '#fbbf24' }]} />
                <Text style={styles.pieChartLegendText}>3 times: 1 (20.0%)</Text>
              </View>
            </View>
          </View>


        </View>

        {/* Defect Distribution by Type - Separate Row */}
        <View style={styles.singleChartRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Defect Distribution by Type</Text>

            {/* Multi-Color Pie Chart */}
            <View style={styles.multiPieChartContainer}>
              <View style={styles.fourColorPieChart}>
                {/* Blue section (Functionality - 52.8%) - Largest */}
                <View style={styles.functionalityPie} />

                {/* Red section (Validation - 22.4%) - Second largest */}
                <View style={styles.validationPie} />

                {/* Green section (UI - 18.1%) - Third */}
                <View style={styles.uiPie} />

                {/* Yellow section (Usability - 6.7%) - Smallest */}
                <View style={styles.usabilityPie} />
              </View>
            </View>

            {/* Legend */}
            <View style={styles.multiPieChartLegend}>
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
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>447</Text>
                <Text style={styles.summaryLabel}>Total Defects</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>236</Text>
                <Text style={styles.summaryLabel}>Most Common: Functionality</Text>
              </View>
            </View>
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
            <View style={styles.moduleChartContent}>
              {/* Pie Chart */}
              <View style={styles.pieChartContainer}>
                <View style={styles.pieChartPlaceholder}>
                  <Text style={styles.pieChartText}>🥧 Pie Chart</Text>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legendContainer}>
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
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ea4335' }]} />
                  <Text style={styles.legendText}>Defects</Text>
                  <Text style={styles.legendValue}>63 (14.16%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ff6d01' }]} />
                  <Text style={styles.legendText}>Test Cases</Text>
                  <Text style={styles.legendValue}>45 (10.11%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#00bcd4' }]} />
                  <Text style={styles.legendText}>Employee</Text>
                  <Text style={styles.legendValue}>67 (15.06%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#9c27b0' }]} />
                  <Text style={styles.legendText}>Releases</Text>
                  <Text style={styles.legendValue}>15 (3.37%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#795548' }]} />
                  <Text style={styles.legendText}>Project</Text>
                  <Text style={styles.legendValue}>22 (4.94%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#607d8b' }]} />
                  <Text style={styles.legendText}>Multi Template</Text>
                  <Text style={styles.legendValue}>4 (0.90%)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#e91e63' }]} />
                  <Text style={styles.legendText}>Dashboard</Text>
                  <Text style={styles.legendValue}>17 (3.82%)</Text>
                </View>
              </View>
            </View>
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
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  remarkRatioBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

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
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
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
