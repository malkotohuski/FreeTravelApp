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

  // Замени ImageBackground с прост View
  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* Аватар с ореол */}
            <View style={styles.avatarHaloWrapper}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.5)', 'transparent']}
                style={styles.avatarHalo}
              />
            </View>
            <Image source={{uri: user.userImage}} style={styles.avatar} />
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
                {user.averageRating?.toFixed(2) || '0.00'} / 5
              </Text>
            </View>

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
                <Text style={styles.commentUser}>{c.user}</Text>
              </View>
              <Text style={styles.commentDate}>{formatDate(c.date)}</Text>
            </View>
            <Text style={styles.commentText}>{c.comment}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noData}>{t('No comments yet.')}</Text>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#145e8fff', // светъл и чист фон
    paddingHorizontal: 16,
    paddingTop: 20,
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
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },

  avatarHalo: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 1,
    marginBottom: 10,
  },

  headerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  fullName: {
    fontSize: 16,
    color: '#020202ff',
    marginBottom: 10,
  },

  section: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },

  starsContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    justifyContent: 'center',
  },

  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },

  commentBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },

  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },

  commentText: {
    fontSize: 14,
    color: '#333',
  },

  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  commentAvatarFallback: {
    backgroundColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },

  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  commentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default UserDetailsScreen;
