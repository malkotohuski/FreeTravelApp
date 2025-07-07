import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000';

function Seekers({navigation}) {
  const {t} = useTranslation();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeekers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/seekers`);
        if (response.status === 200) {
          setRoutes(response.data);
        } else {
          setError(t('Failed to fetch routes.'));
        }
      } catch (err) {
        console.error('Error fetching seekers:', err);
        setError(t('Error fetching route data.'));
      } finally {
        setLoading(false);
      }
    };

    fetchSeekers();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../../images/d7.png')}
        style={styles.backgroundImage}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#f4511e"
          style={{marginTop: 40}}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {routes.length === 0 ? (
            <Text style={styles.errorText}>{t('No routes available.')}</Text>
          ) : (
            routes.map((route, index) => {
              const {
                routeTitle,
                selectedDateTime,
                departureCity,
                arrivalCity,
                userFname,
                userLname,
                username,
              } = route;

              const formattedDate = new Date(
                selectedDateTime,
              ).toLocaleDateString('bg-BG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <View key={index} style={styles.routeCard}>
                  <Text style={styles.routeText}>{routeTitle}</Text>
                  <Text style={styles.dateText}>{formattedDate}</Text>
                  <Text style={styles.routeText}>
                    {departureCity} ➝ {arrivalCity}
                  </Text>
                  <Text style={styles.creatorText}>
                    {t('Created by')}: {userFname} {userLname} (@{username})
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>{t('Back')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  routeCard: {
    backgroundColor: '#ffffffcc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1b1c1e',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f4511e',
    marginBottom: 6,
  },
  creatorText: {
    fontSize: 16,
    marginTop: 8,
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    margin: 20,
    backgroundColor: '#f4511e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Seekers;
