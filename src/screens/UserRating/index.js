import React, {useState, useContext, useCallback} from 'react';
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

const API_BASE_URL = 'http://10.0.2.2:3000';

const RateUserScreen = ({navigation}) => {
  const {t} = useTranslation();
  const route = useRoute();
  const {mainRouteUser, routeId, type, fromUserId} = route.params;
  console.log('USER_ID', fromUserId);

  const {user} = useAuth();
  const currentUser = user?.username;
  const currentUserId = user?.id;
  const currentUserImage = user?.userImage;
  const {darkMode} = useContext(DarkModeContext);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

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
      console.log('=== SUBMIT RATING START ===');
      console.log('route.params:', route.params);
      console.log('currentUserId:', currentUserId, 'username:', currentUser);

      // 1. Взимаме всички потребители
      const usersResponse = await fetch(`${API_BASE_URL}/users`);
      const users = await usersResponse.json();

      const ratingUser = users.find(u => u.id === currentUserId);
      if (!ratingUser) {
        Alert.alert(t('Error'), t('Current user not found.'));
        return;
      }

      // Този, който ще бъде оценен (mainRouteUser идва от навигацията)
      let userToRate = users.find(u => u.username === mainRouteUser);

      // 2. Взимаме всички заявки за маршрута
      const requestsResponse = await fetch(`${API_BASE_URL}/requests`);
      const requests = await requestsResponse.json();

      const routeRequests = requests.filter(
        r => r.routeId === routeId && r.status === 'approved',
      );

      if (routeRequests.length === 0) {
        Alert.alert(t('Error'), t('No approved requests for this route.'));
        return;
      }

      let requestToUpdate = null;
      let updateField = null;

      // 🟢 Ако логнатият е създателя на маршрута
      if (ratingUser.id === routeRequests[0].userRouteId) {
        console.log('Current user IS the creator');

        // Търсим участника, който трябва да бъде оценен
        requestToUpdate = routeRequests.find(
          r =>
            r.userID === fromUserId &&
            r.rateUser === false &&
            r.username === mainRouteUser,
        );

        if (!requestToUpdate) {
          Alert.alert(
            t('Information'),
            t('This participant is already rated or not found.'),
          );
          return;
        }

        userToRate = users.find(u => u.id === fromUserId);
        updateField = {rateUser: true};
      } else {
        // 🟢 Ако логнатият е участник → оценява създателя
        console.log('Current user IS a participant');

        const creatorId = routeRequests[0].userRouteId;
        requestToUpdate = routeRequests.find(
          r =>
            r.userID === ratingUser.id &&
            r.rateCreator === false &&
            r.userRouteId === creatorId,
        );

        if (!requestToUpdate) {
          Alert.alert(
            t('Information'),
            t('You have already rated the creator or request not found.'),
          );
          return;
        }

        userToRate = users.find(u => u.id === creatorId);
        updateField = {rateCreator: true};
      }

      if (!userToRate) {
        Alert.alert(t('Error'), t('User to rate not found.'));
        return;
      }

      // 3. Подготвяме новите данни за user
      const updatedRatings = [...(userToRate.ratings || []), rating];
      const updatedComments = [
        ...(userToRate.comments || []),
        {
          user: currentUser,
          comment: comment || '',
          image: currentUserImage,
          date: new Date().toISOString(),
        },
      ];
      const averageRating =
        updatedRatings.reduce((sum, r) => sum + r, 0) / updatedRatings.length;

      // PATCH user
      await fetch(`${API_BASE_URL}/users/${userToRate.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ratings: updatedRatings,
          comments: updatedComments,
          averageRating: parseFloat(averageRating.toFixed(2)),
        }),
      });

      // PATCH request → rateUser или rateCreator
      if (requestToUpdate && updateField) {
        await fetch(`${API_BASE_URL}/requests/${requestToUpdate.id}`, {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(updateField),
        });
      }

      Alert.alert(t('Success'), t('Successfully rated the user.'));
      navigation.navigate('Home');
    } catch (error) {
      console.error('❌ Error in submitRating:', error);
      Alert.alert(t('Error'), t('Problem with the server request.'));
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
            {type === 'rate_user'
              ? t('Rate the creator')
              : t('Rate the passenger')}
          </Text>
          <Text style={[styles.subText, {color: darkMode ? '#ccc' : '#000'}]}>
            {t('You appreciate')}{' '}
            <Text style={styles.bold}>{mainRouteUser}</Text>
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
