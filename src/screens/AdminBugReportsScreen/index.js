import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/api';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../theme/useTheme';

const STATUS_OPTIONS = ['open', 'in_review', 'resolved'];
const FILTER_OPTIONS = ['open', 'ALL'];

const STATUS_BADGE_COLORS = {
  open: '#f59e0b',
  in_review: '#2563eb',
  resolved: '#16a34a',
};

const STATUS_LABELS = {
  open: 'Open',
  in_review: 'In review',
  resolved: 'Resolved',
};

const formatDate = value => {
  try {
    return new Date(value).toLocaleString('bg-BG');
  } catch (error) {
    return value;
  }
};

const AdminBugReportsScreen = ({navigation}) => {
  const {user} = useAuth();
  const theme = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('open');
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(
    async (showLoader = true) => {
      if (!user?.isAdmin) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await api.get('/api/bug-reports/admin/all');
        const nextReports = Array.isArray(response.data)
          ? response.data
          : response.data?.reports || [];
        setReports(nextReports);
      } catch (error) {
        console.error('Failed to fetch admin bug reports:', error);
        Alert.alert('Error', 'Could not load bug reports.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.isAdmin],
  );

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports]),
  );

  const updateStatus = async (reportId, status) => {
    try {
      setUpdatingId(reportId);
      const response = await api.patch(`/api/bug-reports/${reportId}/status`, {
        status,
      });

      setReports(prev =>
        prev.map(report =>
          report.id === reportId ? response.data.report : report,
        ),
      );
    } catch (error) {
      console.error('Failed to update bug report status:', error);
      Alert.alert('Error', 'Could not update bug report status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openImage = async imageUrl => {
    try {
      const supported = await Linking.canOpenURL(imageUrl);
      if (!supported) {
        Alert.alert('Error', 'Could not open image link.');
        return;
      }

      await Linking.openURL(imageUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open image link.');
    }
  };

  const shareImageLink = async imageUrl => {
    try {
      await Share.share({message: imageUrl});
    } catch (error) {
      Alert.alert('Error', 'Could not share image link.');
    }
  };

  const openReporterProfile = userId => {
    if (!userId) {
      Alert.alert('Error', 'Reporter profile is not available.');
      return;
    }

    navigation.navigate('UserDetails', {
      userId,
      fromScreen: 'AdminBugReports',
    });
  };

  const visibleReports =
    activeFilter === 'open'
      ? reports.filter(report => report.status === 'open')
      : reports;

  if (!user?.isAdmin) {
    return (
      <SafeAreaView
        style={[styles.centered, {backgroundColor: theme.gradient[0]}]}>
        <Text style={[styles.accessDenied, {color: theme.textPrimary}]}>
          Access denied.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.gradient[0]}}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primaryButton} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReports(false);
              }}
              tintColor={theme.primaryButton}
            />
          }>
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(option => {
              const isActive = activeFilter === option;

              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: isActive
                        ? theme.primaryButton
                        : theme.inputBackground,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  onPress={() => setActiveFilter(option)}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      {color: isActive ? '#fff' : theme.textPrimary},
                    ]}>
                    {option === 'open' ? 'Open only' : 'All bug reports'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {visibleReports.length === 0 ? (
            <View style={styles.centered}>
              <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
                {activeFilter === 'open'
                  ? 'No open bug reports.'
                  : 'No bug reports yet.'}
              </Text>
            </View>
          ) : (
            visibleReports.map(report => (
              <View
                key={report.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <Text style={[styles.cardTitle, {color: theme.textPrimary}]}>
                  Bug Report #{report.id}
                </Text>
                <Text style={[styles.cardMeta, {color: theme.textSecondary}]}>
                  Reporter: {report.reporter?.username || 'Unknown'} (
                  {report.reporter?.email || 'No email'})
                </Text>
                <Text style={[styles.cardMeta, {color: theme.textSecondary}]}>
                  Created: {formatDate(report.createdAt)}
                </Text>
                <Text style={[styles.cardMeta, {color: theme.textSecondary}]}>
                  App version: {report.appVersion || 'Unknown'}
                </Text>
                <Text style={[styles.cardMeta, {color: theme.textSecondary}]}>
                  Device: {report.deviceModel || 'Unknown'}
                </Text>
                <Text style={[styles.cardMeta, {color: theme.textSecondary}]}>
                  Platform: {report.platform || 'Unknown'} /{' '}
                  {report.systemVersion || 'Unknown'}
                </Text>

                <View style={styles.topRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          STATUS_BADGE_COLORS[report.status] ||
                          theme.primaryButton,
                      },
                    ]}>
                    <Text style={styles.statusBadgeText}>
                      {STATUS_LABELS[report.status] || report.status}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.profileButton,
                      {borderColor: theme.cardBorder},
                    ]}
                    onPress={() => openReporterProfile(report.userId)}>
                    <Text
                      style={[
                        styles.profileButtonText,
                        {color: theme.textPrimary},
                      ]}>
                      Open reporter profile
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, {color: theme.textPrimary}]}>
                  Title
                </Text>
                <Text style={[styles.reportText, {color: theme.textPrimary}]}>
                  {report.title}
                </Text>

                <Text style={[styles.sectionTitle, {color: theme.textPrimary}]}>
                  Description
                </Text>
                <Text style={[styles.reportText, {color: theme.textPrimary}]}>
                  {report.description}
                </Text>

                {report.steps ? (
                  <>
                    <Text
                      style={[styles.sectionTitle, {color: theme.textPrimary}]}>
                      Steps
                    </Text>
                    <Text
                      style={[styles.reportText, {color: theme.textPrimary}]}>
                      {report.steps}
                    </Text>
                  </>
                ) : null}

                {report.image ? (
                  <View style={styles.imageSection}>
                    <Image
                      source={{uri: report.image}}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={[
                        styles.linkButton,
                        {backgroundColor: theme.primaryButton},
                      ]}
                      onPress={() => openImage(report.image)}>
                      <Text style={styles.linkButtonText}>Open image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.secondaryLinkButton,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                      onPress={() => shareImageLink(report.image)}>
                      <Text
                        style={[
                          styles.secondaryLinkButtonText,
                          {color: theme.textPrimary},
                        ]}>
                        Share image link
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  {STATUS_OPTIONS.map(option => {
                    const isActive = report.status === option;
                    const isUpdating = updatingId === report.id;

                    return (
                      <TouchableOpacity
                        key={option}
                        disabled={isUpdating || isActive}
                        style={[
                          styles.statusButton,
                          {
                            backgroundColor: isActive
                              ? theme.primaryButton
                              : theme.inputBackground,
                            borderColor: theme.cardBorder,
                            opacity: isUpdating || isActive ? 0.7 : 1,
                          },
                        ]}
                        onPress={() => updateStatus(report.id, option)}>
                        <Text
                          style={[
                            styles.statusButtonText,
                            {
                              color: isActive ? '#fff' : theme.textPrimary,
                            },
                          ]}>
                          {STATUS_LABELS[option]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  accessDenied: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  topRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  profileButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  reportText: {
    fontSize: 15,
    lineHeight: 21,
  },
  imageSection: {
    marginTop: 14,
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryLinkButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryLinkButtonText: {
    fontWeight: '600',
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default AdminBugReportsScreen;
