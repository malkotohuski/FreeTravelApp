import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../theme/useTheme';
import StarRating from 'react-native-star-rating-widget';
import api from '../../api/api';

const Comments = ({navigation, route}) => {
  const {user} = useAuth();
  const theme = useTheme();
  const styles = createStyles(theme);
  const {t} = useTranslation();

  // 🔥 Ако в бъдеще подадеш друг userId
  const profileUserId = user?.id;

  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fadeAnims = useRef([]).current;

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

  const animateCards = useCallback(() => {
    const animations = fadeAnims.map((fadeAnim, index) =>
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, animations).start();
  }, [fadeAnims]);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await api.get(`api/users/${profileUserId}`);
      const receivedRatings = res.data.receivedRatings || [];

      setRatings(receivedRatings);

      // създаваме анимации
      fadeAnims.length = 0;
      receivedRatings.forEach(() => {
        fadeAnims.push(new Animated.Value(0));
      });

      animateCards();
    } catch (error) {
      console.error('Fetch ratings error:', error);
    } finally {
      setLoading(false);
    }
  }, [animateCards, fadeAnims, profileUserId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const renderComment = (item, index) => {
    const fadeAnim = fadeAnims[index];

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.commentCard,
          {
            backgroundColor: theme.cardBackground,
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
            borderLeftWidth: 4,
            borderLeftColor: '#f4511e',
          },
        ]}>
        <View style={styles.commentHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {item.rater?.userImage ? (
              <Image
                source={{uri: item.rater.userImage}}
                style={styles.avatar}
              />
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
                <Text style={{color: 'white', fontWeight: 'bold'}}>
                  {item.rater?.username?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={[styles.username, {color: theme.highlight}]}>
              {item.rater?.username || 'Anonymous'}
            </Text>
          </View>

          <Text style={[styles.date, {color: theme.placeholder}]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        <Text style={[styles.commentText, {color: theme.textPrimary}]}>
          {item.comment}
        </Text>

        <View style={styles.starsContainer}>
          <StarRating
            rating={item.score}
            starSize={22}
            enableHalfStar={false}
            onChange={() => {}}
            enableSwiping={false}
            animationConfig={{scale: 0}}
          />
          <Text style={{marginLeft: 6, color: theme.placeholder}}>
            ({item.score})
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, {backgroundColor: theme.gradient[0]}]}>
      <View style={[styles.header, {backgroundColor: theme.headerBackground}]}>
        <Text style={styles.headerText}>{t('Comments')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AccountManager')}>
          <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.commentsContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primaryButton} />
        ) : ratings.length === 0 ? (
          <Text style={[styles.noCommentsText, {color: theme.textSecondary}]}>
            {t('No comments yet')}
          </Text>
        ) : (
          ratings.map(renderComment)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = theme =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      position: 'absolute',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      width: '100%',
      marginBottom: 10,
    },
    headerText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    mainContent: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    commentsContainer: {
      paddingBottom: 40,
    },
    commentCard: {
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
      marginBottom: 4,
    },
    username: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    date: {
      fontSize: 12,
    },
    commentText: {
      fontSize: 15,
      marginVertical: 6,
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    noCommentsText: {
      textAlign: 'center',
      fontSize: 16,
      marginTop: 40,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10, // ако имаш поддръжка за gap
      marginBottom: 4,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.primaryButton,
      marginRight: 8,
    },
  });

export default Comments;
