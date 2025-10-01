import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
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
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{uri: user.userImage}} style={styles.avatar} />
      <Text style={styles.username}>@{user.username}</Text>
      <Text style={styles.fullName}>
        {user.fName} {user.lName}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Rating')}</Text>
        <View style={styles.starsContainer}>
          {renderStars(user.averageRating)}
        </View>
        <Text style={styles.ratingText}>
          {user.averageRating ? user.averageRating.toFixed(2) : '0.00'} / 5
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('Comments')}</Text>
        {user.comments && user.comments.length > 0 ? (
          user.comments.map((c, idx) => (
            <View key={idx} style={styles.commentBox}>
              <View style={styles.commentHeader}>
                <View style={styles.commentLeft}>
                  {c.image ? (
                    <Image
                      source={{uri: c.image}}
                      style={styles.commentAvatar}
                    />
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
              <Text style={styles.commentText}>{c.comment}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>{t('No comments yet.')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#757171ff', // тъмен фон
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#444',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  fullName: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  section: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center', // 👉 центрира съдържанието
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffcc00',
    textAlign: 'center', // 👉 центрира текста
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    justifyContent: 'center', // 👉 подравнява звездите в средата
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center', // 👉 центрира резултата
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
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    width: '100%',
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 0,
    color: '#ffcc00',
    maxWidth: 100, // 👉 ограничаваме ширината
  },
  commentText: {
    fontSize: 14,
    color: '#ddd',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 👉 раздалечава име и дата
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
    backgroundColor: '#555', // по-тъмен фон
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
    color: '#aaa',
    marginLeft: 10,
  },
});

export default UserDetailsScreen;
