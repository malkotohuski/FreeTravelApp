import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000';

const renderStars = rating => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Icon key={`full-${i}`} name="star" size={24} color="#FFD700" />,
    );
  }

  if (halfStar) {
    stars.push(<Icon key="half" name="star-half" size={24} color="#FFD700" />);
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Icon key={`empty-${i}`} name="star-border" size={24} color="#FFD700" />,
    );
  }

  return stars;
};

const UserInfo = ({route}) => {
  const {username, fName, lName, userImage} = route.params;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/users?username=${username}`,
        );
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Потребителят не беше намерен.</Text>
      </View>
    );
  }

  const {averageRating, comments} = userData;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../../images/d7.png')}
        style={styles.backgroundImage}
      />
      <Image
        source={{uri: userImage || userData.userImage}}
        style={styles.avatar}
      />
      <Text style={styles.name}>
        {fName} {lName}
      </Text>
      <Text style={styles.username}>@{username}</Text>
      <View style={styles.starsRow}>
        {renderStars(averageRating || 0)}
        <Text style={styles.numericRating}>
          ({averageRating?.toFixed(2) || '0.00'})
        </Text>
      </View>

      <Text style={styles.commentsHeader}>💬 Коментари:</Text>

      {Array.isArray(comments) && comments.length > 0 ? (
        comments
          .filter(c => typeof c === 'object' && c.comment?.trim())
          .map((c, index) => (
            <View key={index} style={styles.commentBox}>
              <Text style={styles.commentUser}>👤 {c.user || 'Анонимен'}:</Text>
              <Text style={styles.commentText}>{c.comment}</Text>
              {c.image && (
                <Image source={{uri: c.image}} style={styles.commentImage} />
              )}
              {c.date && (
                <Text style={styles.commentDate}>
                  📅 {new Date(c.date).toLocaleDateString('bg-BG')}
                </Text>
              )}
            </View>
          ))
      ) : (
        <Text style={styles.noComments}>Няма налични коментари.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {color: 'red', fontSize: 18},
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  rating: {
    fontSize: 18,
    color: '#f4511e',
    fontWeight: '600',
    marginBottom: 20,
  },
  commentsHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  commentBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    marginBottom: 6,
  },
  commentImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 6,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  noComments: {
    fontStyle: 'italic',
    color: '#888',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  numericRating: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default UserInfo;
