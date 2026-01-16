import React, {useContext, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Animated} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import StarRating from 'react-native-star-rating-widget';
import {DarkModeContext} from '../../navigation/DarkModeContext';

const Comments = ({navigation}) => {
  const {user} = useAuth();
  const comments = user?.comments || [];
  console.log('comments', comments);

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

  const validCommentObjects = comments.filter(
    c => typeof c === 'object' && c.user && c.comment?.trim(),
  );

  // Вземи последните N рейтинга, колкото са валидните коментари
  const relevantRatings =
    user?.ratings?.slice(-validCommentObjects.length) || [];

  // Изгради структурата
  const structuredComments = validCommentObjects.map((c, index) => ({
    username: c.user,
    text: c.comment,
    rating: relevantRatings[index] ?? undefined,
    date: c.date ?? null,
    image: c.image ?? null, // добавено поле
  }));

  const {t} = useTranslation();
  const {darkMode} = useContext(DarkModeContext);

  const fadeAnims = useRef(
    structuredComments.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = fadeAnims.map((fadeAnim, index) =>
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(100, animations).start();
  }, []);

  const renderComment = (item, index) => {
    const {text, username, date, rating, image} = item;
    const fadeAnim = fadeAnims[index];

    return (
      <Animated.View
        key={index}
        style={[
          styles.commentCard,
          {
            backgroundColor: darkMode ? '#444' : '#fff',
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
            {image ? (
              <Image source={{uri: image}} style={styles.avatar} />
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
                  {username?.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.username,
                {color: darkMode ? '#ffa726' : '#f4511e', marginLeft: 10},
              ]}>
              {username || 'Anonymous'}
            </Text>
          </View>

          <Text style={[styles.date, {color: darkMode ? '#ccc' : '#666'}]}>
            {formatDate(date)}
          </Text>
        </View>

        <Text style={[styles.commentText, {color: darkMode ? '#fff' : '#000'}]}>
          {text}
        </Text>

        {rating !== undefined && (
          <View style={styles.starsContainer}>
            <StarRating
              rating={rating}
              starSize={24}
              enableHalfStar={true}
              onChange={() => {}}
              starStyle={{marginHorizontal: 1}}
              animationConfig={{scale: 0}}
              enableSwiping={false}
            />
            <Text style={{marginLeft: 6, color: darkMode ? '#ccc' : '#333'}}>
              ({rating})
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Image
        source={require('../../../images/register-number-background2.jpg')}
        style={styles.backgroundImage}
      />

      {/* Header изцяло извън вътрешния контейнер */}
      <View
        style={[
          styles.header,
          {backgroundColor: darkMode ? '#333232FF' : '#f4511e'},
        ]}>
        <Text style={styles.headerText}>{t('Comments')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AccountManager')}>
          <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <ScrollView contentContainerStyle={styles.commentsContainer}>
          {comments.length > 0 ? (
            structuredComments.map(renderComment)
          ) : (
            <Text
              style={[
                styles.noCommentsText,
                {color: darkMode ? '#ccc' : '#555'},
              ]}>
              {t('No comments yet')}
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
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
    borderColor: '#f4511e',
    marginRight: 8,
  },
});

export default Comments;
