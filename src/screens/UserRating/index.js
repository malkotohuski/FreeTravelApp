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
import {useFocusEffect} from '@react-navigation/native';
import StarRating from 'react-native-star-rating-widget';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import {useAuth} from '../../context/AuthContext';
import {useRoute} from '@react-navigation/native';

const API_BASE_URL = 'http://10.0.2.2:3000';

const RateUserScreen = ({navigation}) => {
  const route = useRoute();
  const {mainRouteUser, routeId} = route.params;
  const {user} = useAuth();
  const currentUser = user?.user?.username;
  const currentUserImage = user?.user?.userImage;
  console.log('kdsf', routeId);
  console.log('асдасд', mainRouteUser);

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
      return Alert.alert('Грешка', 'Моля, избери брой звезди.');
    }

    try {
      const usersResponse = await fetch(`${API_BASE_URL}/users`);
      const users = await usersResponse.json();

      const userToRate = users.find(user => user?.username === mainRouteUser);
      const ratingUser = users.find(u => u?.username === currentUser);

      if (!userToRate || !ratingUser) {
        return Alert.alert('Грешка', 'Потребителят не е намерен.');
      }

      const alreadyRated =
        Array.isArray(ratingUser.routes) && ratingUser.routes.includes(routeId);
      if (alreadyRated) {
        return Alert.alert('Информация', 'Вече си оценил този маршрут.');
      }

      const previousRatings = Array.isArray(userToRate.ratings)
        ? userToRate.ratings
        : [];
      const previousComments = Array.isArray(userToRate.comments)
        ? userToRate.comments
        : [];

      const updatedRatings = [...previousRatings, rating];
      const updatedComments = [
        ...previousComments,
        {
          user: currentUser,
          comment: comment || '',
          image: currentUserImage,
          date: new Date().toISOString(), // <-- добавена дата
        },
      ];

      const averageRating =
        updatedRatings.reduce((sum, r) => sum + r, 0) / updatedRatings.length;

      await fetch(`${API_BASE_URL}/users/${userToRate.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ratings: updatedRatings,
          comments: updatedComments,
          averageRating: parseFloat(averageRating.toFixed(2)),
        }),
      });

      const updatedRoutes = Array.isArray(ratingUser.routes)
        ? [...ratingUser.routes, routeId]
        : [routeId];

      await fetch(`${API_BASE_URL}/users/${ratingUser.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          routes: updatedRoutes,
        }),
      });

      Alert.alert('Успех', 'Успешно оцени потребителя.');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Грешка', 'Проблем със заявката към сървъра.');
      console.log(error);
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
          <Text style={styles.headerText}>Rating</Text>
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
            Оцени потребителя
          </Text>

          <Text style={[styles.subText, {color: darkMode ? '#ccc' : '#000'}]}>
            Оценяваш <Text style={styles.bold}>{mainRouteUser}</Text>
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
            placeholder="Добави коментар (по избор)..."
            placeholderTextColor={darkMode ? '#aaa' : '#999'}
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity style={styles.button} onPress={submitRating}>
            <Text style={styles.buttonText}>Изпрати оценка</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default RateUserScreen;

// --- StyleSheet остава непроменен ---
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
