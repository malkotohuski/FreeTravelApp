import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useRef,
  useContext,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api/api';
import {useTranslation} from 'react-i18next';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import LinearGradient from 'react-native-linear-gradient';

const renderStars = rating => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const stars = [];
  for (let i = 0; i < fullStars; i += 1) {
    stars.push(
      <Icon key={`full-${i}`} name="star" size={20} color="#FFD700" />,
    );
  }
  if (halfStar) {
    stars.push(<Icon key="half" name="star-half" size={20} color="#FFD700" />);
  }
  for (let i = 0; i < emptyStars; i += 1) {
    stars.push(
      <Icon key={`empty-${i}`} name="star-border" size={20} color="#FFD700" />,
    );
  }
  return stars;
};

const UserInfo = ({route, navigation}) => {
  const {darkMode} = useContext(DarkModeContext);
  const {t} = useTranslation();

  const {
    username,
    userFname,
    userLname,
    userId,
    userEmail,
    routeId,
    departureCityId,
    departureCity,
    arrivalCityId,
    arrivalCity,
    selectedVehicle,
    registrationNumber,
    selectedDateTime,
    routeTitle,
    routeDetailsData,
    fromScreen = 'RouteDetails',
  } = route.params;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnims = useRef([]).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: 16}}
          onPress={() => {
            if (fromScreen === 'Seekers') {
              navigation.navigate('Seekers');
            } else {
              navigation.navigate('RouteDetails', {
                username,
                userFname,
                userLname,
                userEmail,
                userId,
                routeId,
                departureCityId,
                departureCity,
                arrivalCityId,
                arrivalCity,
                selectedVehicle,
                registrationNumber,
                selectedDateTime,
                routeTitle,
                routeDetailsData,
              });
            }
          }}>
          <Icon
            name="keyboard-backspace"
            size={26}
            color={darkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    fromScreen,
    username,
    userFname,
    userLname,
    userEmail,
    userId,
    routeId,
    selectedVehicle,
    registrationNumber,
    selectedDateTime,
    routeTitle,
    routeDetailsData,
    departureCity,
    departureCityId,
    arrivalCity,
    arrivalCityId,
    darkMode,
  ]);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      setUserData(res.data);
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (userData?.receivedRatings) {
      fadeAnims.length = 0;
      userData.receivedRatings.forEach((_, index) => {
        fadeAnims[index] = new Animated.Value(0);
      });
      const animations = fadeAnims.map((fadeAnim, index) =>
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true,
        }),
      );
      Animated.stagger(100, animations).start();
    }
  }, [fadeAnims, userData]);

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          {backgroundColor: darkMode ? '#1c1c1c' : '#fff'},
        ]}>
        <ActivityIndicator
          size="large"
          color={darkMode ? '#ffa726' : '#f4511e'}
        />
      </View>
    );
  }

  if (!userData) {
    return (
      <View
        style={[
          styles.centered,
          {backgroundColor: darkMode ? '#1c1c1c' : '#fff'},
        ]}>
        <Text style={{color: 'red', fontSize: 18}}>
          {t('User not found.')}
        </Text>
      </View>
    );
  }

  const {averageRating, receivedRatings = []} = userData;

  const renderComment = (comment, index) => {
    const fadeAnim = fadeAnims[index] || new Animated.Value(1);
    const author = comment.rater || {};

    return (
      <Animated.View
        key={comment.id || index}
        style={[
          styles.commentCard,
          {
            backgroundColor: darkMode ? '#2a2a2a' : '#fff',
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorRow}>
            {author.userImage ? (
              <Image source={{uri: author.userImage}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {author.username?.slice(0, 2).toUpperCase() || 'AN'}
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.username,
                {color: darkMode ? '#ffa726' : '#f4511e'},
              ]}>
              {author.username || t('Anonymous')}
            </Text>
          </View>
          <Text style={{color: darkMode ? '#ccc' : '#666', fontSize: 12}}>
            {new Date(comment.createdAt).toLocaleDateString('bg-BG', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <Text style={[styles.commentText, {color: darkMode ? '#fff' : '#000'}]}>
          {comment.comment}
        </Text>

        {comment.score !== undefined && (
          <View style={styles.commentRatingRow}>
            {renderStars(comment.score)}
            <Text style={{marginLeft: 6, color: darkMode ? '#ccc' : '#333'}}>
              ({comment.score})
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={darkMode ? ['#1c1c1c', '#3a3a3a'] : ['#f5f5f5', '#e0e0e0']}
      style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUserData();
            }}
            tintColor={darkMode ? '#ffa726' : '#f4511e'}
          />
        }>
        <Image source={{uri: userData.userImage}} style={styles.avatarLarge} />
        <Text style={[styles.name, {color: darkMode ? '#fff' : '#000'}]}>
          {userData.userFname} {userData.userLname}
        </Text>
        <Text
          style={[styles.usernameText, {color: darkMode ? '#ccc' : '#000'}]}>
          @{username}
        </Text>
        <View style={styles.averageRatingRow}>
          {renderStars(averageRating || 0)}
          <Text style={{marginLeft: 6, color: darkMode ? '#ccc' : '#000'}}>
            ({averageRating?.toFixed(2) || '0.00'})
          </Text>
        </View>

        <Text
          style={[styles.commentsHeader, {color: darkMode ? '#fff' : '#000'}]}>
          {t('Comments')}
        </Text>

        {receivedRatings.length > 0 ? (
          receivedRatings.map(renderComment)
        ) : (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 20,
              color: darkMode ? '#ccc' : '#080808',
            }}>
            {t('No comments available.')}
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: {flex: 1},
  container: {alignItems: 'center', padding: 16, paddingBottom: 40},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ccc',
    marginBottom: 12,
  },
  name: {fontSize: 20, fontWeight: 'bold'},
  usernameText: {fontSize: 16, marginBottom: 10},
  averageRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  commentCard: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  commentText: {fontSize: 15, marginVertical: 6},
  commentRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {width: 40, height: 40, borderRadius: 20},
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserInfo;
