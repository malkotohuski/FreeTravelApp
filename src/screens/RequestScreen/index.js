import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

function RouteDetails({route}) {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user} = useAuth();

  const {
    username,
    userFname,
    userLname,
    departureCity,
    arrivalCity,
    routeId,
    selectedDateTime,
  } = route.params;

  console.log('rating', averageRating);

  const loginUsername = user?.username;
  const isOwnRoute = loginUsername === username;

  const [comment, setComment] = useState('');
  const [hasRequested, setHasRequested] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const userImage = profileData?.userImage;
  const averageRating = profileData?.averageRating;
  const comments = profileData?.comments || [];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/users'); // взимаме всички users
        const userProfile = res.data.find(u => u.username === username);

        if (userProfile) {
          setProfileData(userProfile);
        } else {
          console.warn('User not found in database');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchUserProfile();
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      setComment('');
    }, []),
  );

  useEffect(() => {
    const checkExistingRequest = async () => {
      try {
        const res = await api.get('/notifications');
        const exists = res.data.some(
          n => n.requester?.username === loginUsername && n.routeId === routeId,
        );
        setHasRequested(exists);
      } catch (e) {
        console.log(e);
      }
    };

    checkExistingRequest();
  }, [loginUsername, routeId]);

  const handleApply = () => {
    if (!comment.trim()) {
      Alert.alert(t('Error'), t('Please enter a comment.'));
      return;
    }

    Alert.alert(t('Confirm'), t('Do you want to apply for this route?'), [
      {text: t('Cancel'), style: 'cancel'},
      {
        text: 'OK',
        onPress: async () => {
          try {
            await api.post('/send-request-to-user', {
              requestingUser: {
                username: user?.username,
                userID: user?.id,
                routeId,
                comment,
                status: 'pending',
              },
            });

            setHasRequested(true);

            Alert.alert(
              t('Success'),
              t('Your request was sent successfully.'),
              [{text: 'OK', onPress: () => navigation.navigate('Home')}],
            );
          } catch (err) {
            Alert.alert(
              t('Error'),
              err.response?.data?.message || 'Request failed',
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {departureCity} → {arrivalCity}
        </Text>

        <Text style={styles.subtitle}>
          {new Date(selectedDateTime).toLocaleString()}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.text}>
          {t('Driver')}: {username}
        </Text>

        {!isOwnRoute && (
          <TouchableOpacity onPress={() => setProfileVisible(true)}>
            <Text style={styles.linkText}>{t('View profile')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          placeholder={t('Write a short message...')}
          placeholderTextColor="#aaa"
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isOwnRoute || hasRequested) && styles.disabledButton,
          ]}
          disabled={isOwnRoute || hasRequested}
          onPress={handleApply}>
          <Text style={styles.buttonText}>
            {hasRequested ? t('Already applied') : t('Apply for this route')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>{t('Back')}</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 PROFILE MODAL */}
      <Modal visible={profileVisible} transparent animationType="fade">
        <View style={modal.overlay}>
          <View style={modal.content}>
            {/* Avatar */}
            {profileData?.userImage ? (
              <Image
                source={{uri: profileData.userImage}}
                style={modal.avatar}
              />
            ) : (
              <View
                style={[
                  modal.avatar,
                  {
                    backgroundColor: '#888',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}>
                <Text
                  style={{color: 'white', fontWeight: 'bold', fontSize: 24}}>
                  {(profileData?.username || username)
                    ?.slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
            )}

            <Text style={modal.title}>{profileData?.username || username}</Text>
            <Text style={modal.text}>
              {profileData?.fName || userFname}{' '}
              {profileData?.lName || userLname}
            </Text>

            <Text style={modal.rating}>
              ⭐ {profileData?.averageRating ?? t('No ratings yet')}
            </Text>

            <ScrollView style={{maxHeight: 180, marginTop: 10}}>
              {profileData?.comments?.length ? (
                profileData.comments.map((c, i) => (
                  <View key={i} style={modal.commentContainer}>
                    {c.image ? (
                      <Image
                        source={{uri: c.image}}
                        style={modal.commentAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          modal.commentAvatar,
                          {
                            backgroundColor: '#888',
                            justifyContent: 'center',
                            alignItems: 'center',
                          },
                        ]}>
                        <Text
                          style={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 14,
                          }}>
                          {c.user?.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{flex: 1}}>
                      <Text style={modal.commentUser}>{c.user}</Text>
                      <Text style={modal.commentText}>{c.comment}</Text>
                      <Text style={modal.commentDate}>
                        {new Date(c.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={modal.noComments}>{t('No comments yet')}</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={modal.closeButton}
              onPress={() => setProfileVisible(false)}>
              <Text style={styles.buttonText}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '90%',
    backgroundColor: '#2b2b2b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },

  subtitle: {
    fontSize: 16,
    color: '#bbb',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },

  text: {
    fontSize: 17,
    color: '#eee',
  },

  linkText: {
    color: '#f4511e',
    fontSize: 16,
    marginTop: 6,
    fontWeight: '600',
  },

  input: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor: '#f4511e',
    padding: 14,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
  },

  disabledButton: {
    backgroundColor: '#555',
  },

  secondaryButton: {
    backgroundColor: '#444',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },

  content: {
    backgroundColor: '#2b2b2b',
    borderRadius: 16,
    padding: 20,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 10,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  text: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },

  rating: {
    color: '#f1c40f',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },

  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    padding: 8,
  },

  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },

  commentUser: {
    color: '#f4511e',
    fontWeight: '700',
    fontSize: 14,
  },

  commentText: {
    color: '#eee',
    fontSize: 14,
  },

  commentDate: {
    color: '#aaa',
    fontSize: 12,
  },

  noComments: {
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },

  closeButton: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    alignItems: 'center',
  },
});

export {RouteDetails};
