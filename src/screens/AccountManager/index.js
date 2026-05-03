import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../../theme/useTheme';
import api from '../../api/api';

const {height} = Dimensions.get('window');

const StarRatingDisplay = ({rating, size = 50}) => {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2;

  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;

  for (let i = 0; i < fullStars; i += 1) {
    stars.push(
      <Icons key={`full-${i}`} name="star" size={size} color="gold" />,
    );
  }

  if (hasHalfStar) {
    stars.push(<Icons key="half" name="star-half" size={size} color="gold" />);
  }

  return (
    <View style={{flexDirection: 'row', justifyContent: 'center'}}>{stars}</View>
  );
};

const AccountManager = ({navigation}) => {
  const {user} = useAuth();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const defaultProfilePicture = require('../../../images/emptyUserImage.png');
  const {t} = useTranslation();

  const handlerCommendSection = () => navigation.navigate('Comments');
  const handlerChangeAcountSettings = () =>
    navigation.navigate('AccountSettings');
  const handlerHomeScreen = () => navigation.navigate('Home');

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoadingProfile(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await api.get(`/api/users/${user.id}`);
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to load account profile:', error);
    } finally {
      setLoadingProfile(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const displayedUser = profileData || user;
  const displayedAverageRating = displayedUser?.averageRating || 0;

  if (loadingProfile) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.gradient[0],
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator size="large" color={theme.primaryButton} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.gradient[0],
      }}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProfile();
            }}
            tintColor={theme.primaryButton}
          />
        }>
        <View style={styles.mainContainer}>
          <View style={styles.overlay} />

          <View style={styles.profilePictureContainer}>
            <Image
              source={
                displayedUser?.userImage
                  ? {uri: displayedUser.userImage}
                  : defaultProfilePicture
              }
              style={styles.profilePicture}
            />
          </View>

          <View style={styles.userInfoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Username')}:</Text>
              <Text style={styles.infoText}>{displayedUser?.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Names')}:</Text>
              <Text style={styles.infoText}>
                {displayedUser?.fName} {displayedUser?.lName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('Email')}:</Text>
              <Text style={styles.infoText}>{displayedUser?.email}</Text>
            </View>
          </View>

          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>{t('Your rating')}</Text>
            <StarRatingDisplay rating={displayedAverageRating} size={50} />
          </View>
          <Text
            style={{
              color: theme.textPrimary,
              marginBottom: 5,
              fontSize: 20,
              fontWeight: 'bold',
            }}>
            ({displayedAverageRating.toFixed(2)})
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handlerCommendSection}>
              <Text style={styles.buttonText}>{t('Comments')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handlerChangeAcountSettings}>
              <Text style={styles.buttonText}>{t('Change user settings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handlerHomeScreen}>
              <Text style={styles.buttonText}>{t('Lets travel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1e1e1e',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    mainContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backgroundImage: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    profilePictureContainer: {
      marginTop: height * 0.05,
      marginBottom: 20,
      alignItems: 'center',
    },
    profilePicture: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.cardBorder,
    },
    userInfoSection: {
      width: '90%',
      padding: 15,
      backgroundColor: theme.cardBackground,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      marginVertical: 10,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },
    infoLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    infoText: {
      fontSize: 16,
      color: theme.textPrimary,
      flexShrink: 1,
      textAlign: 'right',
    },
    userInfoText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      marginVertical: 4,
    },
    ratingSection: {
      alignItems: 'center',
    },
    ratingTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 10,
    },
    ratingStars: {
      flexDirection: 'row',
    },
    buttonsContainer: {
      width: '100%',
      paddingHorizontal: 20,
      marginBottom: height * 0.05,
    },
    button: {
      backgroundColor: theme.primaryButton,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });

export default AccountManager;
