import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useRef,
  useContext,
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api/api';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import LinearGradient from 'react-native-linear-gradient';

const renderStars = rating => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const stars = [];
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Icon key={`full-${i}`} name="star" size={20} color="#FFD700" />,
    );
  }
  if (halfStar) {
    stars.push(<Icon key="half" name="star-half" size={20} color="#FFD700" />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Icon key={`empty-${i}`} name="star-border" size={20} color="#FFD700" />,
    );
  }
  return stars;
};

const UserInfo = ({route, navigation}) => {
  const {darkMode} = useContext(DarkModeContext);

  // Взимаме всички params за RouteDetails бутона
  const {
    username,
    userFname,
    userLname,
    userEmail,
    userId,
    selectedVehicle,
    registrationNumber,
    routeDetailsData,
    departureCity,
    arrivalCity,
  } = route.params;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fadeAnims = useRef([]).current;

  // Фиксираме логиката за бутона за back
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: 16}}
          onPress={() =>
            navigation.navigate('RouteDetails', {
              username,
              userFname,
              userLname,
              userEmail,
              userId,
              departureCity,
              arrivalCity,
              selectedVehicle,
              registrationNumber,
              routeDetailsData,
            })
          }>
          <Icon name="keyboard-backspace" size={26} color="#ffffff" />
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    username,
    userFname,
    userLname,
    userEmail,
    userId,
    selectedVehicle,
    registrationNumber,
    routeDetailsData,
    departureCity,
    arrivalCity,
  ]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get(`/users?username=${username}`);
        if (res.data.length > 0) {
          setUserData(res.data[0]);
        }
      } catch (err) {
        console.error('Грешка при зареждане на потребителя:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [username]);

  useEffect(() => {
    if (userData?.comments) {
      userData.comments.forEach((_, i) => {
        fadeAnims[i] = new Animated.Value(0);
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
  }, [userData]);

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          {backgroundColor: darkMode ? '#111' : '#fff'},
        ]}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View
        style={[
          styles.centered,
          {backgroundColor: darkMode ? '#111' : '#fff'},
        ]}>
        <Text style={{color: 'red', fontSize: 18}}>
          Потребителят не беше намерен.
        </Text>
      </View>
    );
  }

  const {averageRating, comments = []} = userData;

  const formatDate = isoDate => {
    if (!isoDate) return 'Unknown date';
    const date = new Date(isoDate);
    return date.toLocaleDateString('bg-BG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComment = (c, index) => {
    const fadeAnim = fadeAnims[index] || new Animated.Value(1);
    return (
      <Animated.View
        key={index}
        style={[
          styles.commentCard,
          {
            backgroundColor: darkMode ? '#222' : '#fff',
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
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {c.image ? (
              <Image source={{uri: c.image}} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: '#888',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>
                  {c.user?.slice(0, 2).toUpperCase() || 'AN'}
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.username,
                {color: darkMode ? '#ffa726' : '#f4511e', marginLeft: 10},
              ]}>
              {c.user || 'Анонимен'}
            </Text>
          </View>
          <Text style={{color: darkMode ? '#ccc' : '#666', fontSize: 12}}>
            {formatDate(c.date)}
          </Text>
        </View>
        <Text style={[styles.commentText, {color: darkMode ? '#fff' : '#000'}]}>
          {c.comment}
        </Text>
        {c.rating !== undefined && (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {renderStars(c.rating)}
            <Text style={{marginLeft: 6, color: darkMode ? '#ccc' : '#333'}}>
              ({c.rating})
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#1b1b1b', '#686666']}
      style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{uri: userData.userImage}} style={styles.avatarLarge} />
        <Text style={[styles.name, {color: darkMode ? '#fff' : '#000'}]}>
          {userData.userFname} {userData.userLname}
        </Text>
        <Text
          style={[styles.usernameText, {color: darkMode ? '#ccc' : '#000000'}]}>
          @{username}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 12,
          }}>
          {renderStars(averageRating || 0)}
          <Text style={{marginLeft: 6, color: darkMode ? '#ccc' : '#000000'}}>
            ({averageRating?.toFixed(2) || '0.00'})
          </Text>
        </View>
        <Text
          style={[styles.commentsHeader, {color: darkMode ? '#fff' : '#000'}]}>
          💬 Коментари:
        </Text>
        {comments.length > 0 ? (
          comments.map(renderComment)
        ) : (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 20,
              color: darkMode ? '#ccc' : '#080808',
            }}>
            Няма налични коментари.
          </Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ccc',
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  usernameText: {
    fontSize: 16,
    marginBottom: 10,
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
  username: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 15,
    marginVertical: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default UserInfo;
