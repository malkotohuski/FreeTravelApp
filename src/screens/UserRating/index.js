import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image
} from 'react-native';
import StarRating from 'react-native-star-rating-widget';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DarkModeContext } from "../../navigation/DarkModeContext";
import { useRoute } from '@react-navigation/native';

const API_BASE_URL = 'http://10.0.2.2:3000';

const RateUserScreen = ({ navigation }) => {
  const route = useRoute();
  const { mainRouteUser } = route.params;
  console.log('Main Route User:', mainRouteUser); // Използвай го както ти е нужно
  const { ratedUserId, fromUserId, routeInfo } = route.params || {};
  const { darkMode } = useContext(DarkModeContext);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitRating = async () => {
    if (rating === 0) {
      return Alert.alert('Грешка', 'Моля, избери брой звезди.');
    }

    if (!ratedUserId || !fromUserId) {
      return Alert.alert('Грешка', 'Липсват потребителски данни за оценяване.');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/rateUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ratedUserId,
          fromUserId,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Успех', 'Успешно оцени потребителя.');
        navigation.goBack();
      } else {
        Alert.alert('Грешка', data.error || 'Неуспешна заявка');
      }
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
      <View style={{ flex: 1 }}>
        <View style={getHeaderStyles()}>
          <Text style={styles.headerText}>Rating</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icons name="keyboard-backspace" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={[styles.container, { backgroundColor: darkMode ? '#121212' : '#fafafa' }]}>
          <Text style={[styles.title, { color: darkMode ? '#fff' : '#000' }]}>Оцени потребителя</Text>

          {ratedUserId && routeInfo ? (
            <Text style={[styles.subText, { color: darkMode ? '#ccc' : '#000' }]}>
              Оценяваш <Text style={styles.bold}>{ratedUserId}</Text> за пътуване от{' '}
              <Text style={styles.bold}>{routeInfo?.departureCity}</Text> до{' '}
              <Text style={styles.bold}>{routeInfo?.arrivalCity}</Text>
            </Text>
          ) : (
            <Text style={[styles.subText, { color: 'red', textAlign: 'center' }]}>
              ⚠️ Липсват данни за потребителя или маршрута
            </Text>
          )}

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
