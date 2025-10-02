import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useRoute} from '@react-navigation/native';

const API_BASE_URL = 'http://10.0.2.2:3000';

function UserDetailsScreen() {
  const {t} = useTranslation();
  const route = useRoute();
  const {userId} = route.params;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatDate = isoString => {
    if (!isoString) return '';
    const date = new Date(isoString);

    return (
      date.toLocaleDateString('bg-BG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) +
      ' в ' +
      date.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user from:', `${API_BASE_URL}/users/${userId}`);
        const res = await fetch(`${API_BASE_URL}/users/${userId}`);

        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error('Error fetching user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const renderStars = rating => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;

    let stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icons key={`full-${i}`} name="star" size={24} color="gold" />,
      );
    }
    if (halfStar) {
      stars.push(
        <Icons key="half" name="star-half-full" size={24} color="gold" />,
      );
    }
    while (stars.length < 5) {
      stars.push(
        <Icons
          key={`empty-${stars.length}`}
          name="star-outline"
          size={24}
          color="gold"
        />,
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>{t('User not found')}</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../images/messa.jpg')}
      style={styles.background}
      resizeMode="cover">
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* Ореол зад аватара */}
            <View style={styles.avatarHaloWrapper}>
              {/* <LinearGradient
                colors={['rgba(255, 255, 255, 0.78)', 'rgba(255,255,255,0)']}
                style={styles.avatarHalo}
              /> */}
            </View>
            {/* Аватар над ореола */}
            <Image source={{uri: user.userImage}} style={styles.avatar} />
            {/* Username и full name */}
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.fullName}>
              {user.fName} {user.lName}
            </Text>

            {/* Рейтинг */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('Rating')}</Text>
              <View style={styles.starsContainer}>
                {renderStars(user.averageRating)}
              </View>
              <Text style={styles.ratingText}>
                {user.averageRating ? user.averageRating.toFixed(2) : '0.00'} /
                5
              </Text>
            </View>

            {/* Заглавие за коментари */}
            <Text style={[styles.sectionTitle, {marginTop: 15}]}>
              {t('Comments')}
            </Text>
          </View>
        }
        data={user.comments || []}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({item: c}) => (
          <View style={styles.commentBox}>
            <View style={styles.commentHeader}>
              <View style={styles.commentLeft}>
                {c.image ? (
                  <Image source={{uri: c.image}} style={styles.commentAvatar} />
                ) : (
                  <View
                    style={[
                      styles.commentAvatar,
                      styles.commentAvatarFallback,
                    ]}>
                    <Text style={styles.commentAvatarText}>
                      {(c.user ? c.user.slice(0, 2) : 'NA').toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text
                  style={styles.commentUser}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {c.user}
                </Text>
              </View>
              <Text style={styles.commentDate}>{formatDate(c.date)}</Text>
            </View>
            <Text
              style={styles.commentText}
              numberOfLines={3}
              ellipsizeMode="tail">
              {c.comment}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noData}>{t('No comments yet.')}</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    zIndex: -1,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarHaloWrapper: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 0},
    zIndex: 0,
  },

  avatarHalo: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    zIndex: 1, // аватарът над ореола
  },
  headerWrapper: {
    justifyContent: 'center',
    alignItems: 'center', // центрира всичко хоризонтално
    marginTop: 100, // разстояние от горния край на екрана
    marginBottom: 20,
    position: 'relative', // важно за absolute на ореола
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#030303ff',
    textAlign: 'center', // центрира текста
  },
  fullName: {
    fontSize: 16,
    color: '#080808ff',
    marginBottom: 20,
    textAlign: 'center', // центрира текста
  },
  section: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000000ff',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 20, // 👉 по-голям рейтинг
    fontWeight: '700',
    color: '#070707ff',
    textAlign: 'center',
  },
  noData: {
    fontSize: 14,
    color: '#999',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  commentBox: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(230, 220, 220, 0.49)',
    borderRadius: 8,
    width: '100%',
    minHeight: 80, // 👉 фиксираме минимална височина за равни "карти"
    justifyContent: 'center', // 👉 центрира текста вертикално
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    color: '#0a0a0aff',
    maxWidth: 100,
    textAlign: 'center',
    alignSelf: 'center',
  },
  commentText: {
    fontSize: 14,
    color: '#050505ff',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentAvatarFallback: {
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentDate: {
    fontSize: 12,
    color: '#070606ff',
    marginLeft: 10,
  },
});

export default UserDetailsScreen;
