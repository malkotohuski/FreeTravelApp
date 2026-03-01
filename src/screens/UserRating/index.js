import React, {useState, useContext, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import StarRating from 'react-native-star-rating-widget';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

const RateUserScreen = ({navigation}) => {
  const {t} = useTranslation();
  const route = useRoute();
  const {routeId, ratedId} = route.params;
  const [ratedUsername, setRatedUsername] = useState(null);
  const {user} = useAuth();
  const currentUser = user?.username;
  const currentUserId = user?.id;
  const currentUserImage = user?.userImage;
  const {darkMode} = useContext(DarkModeContext);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/api/users/${ratedId}`);
        console.log('USER RESPONSE:', res.data); // 👈 добави това
        setRatedUsername(res.data.username);
      } catch (err) {
        console.log('User fetch error', err.response?.data || err);
      }
    };

    if (ratedId) {
      fetchUser();
    }
  }, [ratedId]);

  console.log('ROUTE PARAMS:', route.params);
  console.log('RatedId:', ratedId);
  useFocusEffect(
    useCallback(() => {
      setComment('');
      setRating(0);
    }, []),
  );

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert(t('Error'), t('Please select a number of stars.'));
      return;
    }

    try {
      const response = await api.post('/api/ratings', {
        routeId: routeId,
        ratedId: ratedId,
        score: rating,
        comment: comment,
      });

      Alert.alert(t('Success'), t('Successfully rated the user.'));
      navigation.navigate('Home');
    } catch (error) {
      console.log('Rating error:', error.response?.data);

      if (error.response?.status === 400) {
        Alert.alert(t('Information'), error.response.data.message);
      } else if (error.response?.status === 403) {
        Alert.alert(t('Error'), error.response.data.message);
      } else {
        Alert.alert(t('Error'), t('Server error.'));
      }
    }
  };

  const getHeaderStyles = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e',
  });

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Image
        source={require('../../../images/confirm_test.jpeg')}
        style={styles.backgroundImage}
      />
      <View style={{flex: 1}}>
        <View style={getHeaderStyles()}>
          <Text style={styles.headerText}>{t('Rate')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icons name="keyboard-backspace" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.container,
            {backgroundColor: darkMode ? '#121212' : '#fafafa'},
          ]}>
          <Text style={[styles.title, {color: darkMode ? '#fff' : '#000'}]}>
            {t('Rate user')}
          </Text>
          <Text style={[styles.subText, {color: darkMode ? '#ccc' : '#000'}]}>
            {t('You appreciate')}{' '}
            <Text style={styles.bold}>{ratedUsername ?? t('Loading...')}</Text>
          </Text>
          <StarRating
            rating={rating}
            onChange={setRating}
            starSize={35}
            enableHalfStar={true}
          />
          <TextInput
            style={[
              styles.commentBox,
              {
                color: darkMode ? '#fff' : '#000',
                borderColor: darkMode ? '#555' : '#ccc',
              },
            ]}
            multiline
            placeholder={t('Add a comment (optional)...')}
            placeholderTextColor={darkMode ? '#aaa' : '#999'}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.button} onPress={submitRating}>
            <Text style={styles.buttonText}>{t('Send rating')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RateUserScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'grey',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    opacity: 0.15,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
    color: '#f4511e',
  },
  commentBox: {
    height: 100,
    borderWidth: 1,
    marginVertical: 20,
    padding: 10,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
