import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  Button,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {useRouteContext} from '../../context/RouteContext';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000'; // JSON server
const api = axios.create({
  baseURL: API_BASE_URL,
});

function RouteRequestScreen({route, navigation}) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {requests, refreshUserData} = useRouteContext();
  const [routeRequests, setRouteRequests] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const requestUserFirstName = user?.user?.fName;
  const requestUserLastName = user?.user?.lName;
  const userNow = user?.user?.id;
  const loginUser = user?.user?.username;
  const requesterUsername = user?.user?.username;
  const requestUserEmail = user?.user?.email;
  const requestUserID = user?.user?.userID;

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getRequestsForCurrentUser = () => {
    return requests.filter(request => {
      const currentDate = new Date();
      return (
        request.userRouteId === userNow &&
        new Date(request.dataTime) >= currentDate &&
        (request.status === undefined || request.status === 'pending')
      );
    });
  };

  const fetchAndSetRequests = async () => {
    await refreshUserData();
    setRouteRequests(getRequestsForCurrentUser());
  };

  useFocusEffect(
    useCallback(() => {
      fetchAndSetRequests();
    }, [requests]),
  );

  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    let interval;
    if (isMigrating) {
      interval = setInterval(() => {
        setIsMigrating(prev => !prev);
      }, 500);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isMigrating]);

  const sendRouteResponse = async (request, isApproved) => {
    const dateObj = new Date(request.dataTime);
    const formattedDate = `${dateObj.toLocaleDateString(
      'bg-BG',
    )}, ${dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;

    try {
      const emailText = isApproved
        ? t(
            `Your request has been approved by: ${requestUserFirstName} ${requestUserLastName}.`,
          )
        : t(
            `Your request has NOT been approved by: ${requestUserFirstName} ${requestUserLastName}.`,
          );

      await api.post('/send-request-to-email', {
        email: request.userEmail,
        text: emailText,
      });

      const notificationMessage = isApproved
        ? t(`Your request has been approved from ${requesterUsername}.
About the route: ${request.departureCity}-${request.arrivalCity}.
For date: ${formattedDate}`)
        : t(`Your request has NOT been approved from ${requesterUsername}.
About the route: ${request.departureCity}-${request.arrivalCity}.
For date: ${formattedDate}`);

      await api.post('/notifications', {
        recipient: request.username,
        message: notificationMessage,
        routeChecker: true,
        status: 'active',
        requester: {
          username: requesterUsername,
          userFname: requestUserFirstName,
          userLname: requestUserLastName,
          email: requestUserEmail,
        },
        createdAt: new Date().toISOString(),
      });

      // Обновяване на статуса на заявката
      await api.patch(`/requests/${request.id}`, {
        status: isApproved ? 'approved' : 'rejected',
      });

      await fetchAndSetRequests();
      Alert.alert(
        'Success',
        isApproved ? 'Request approved.' : 'Request rejected.',
      );
    } catch (error) {
      console.error('Error while handling request:', error);
      Alert.alert('Error', 'An error occurred while handling the request.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handlePress = request => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const renderRoutes = () => {
    return routeRequests.length > 0 ? (
      routeRequests.map(request => (
        <TouchableOpacity
          key={request.id}
          style={[
            styles.requestContainer,
            request.requestingUser
              ? isMigrating
                ? styles.migratingGreenBorder
                : styles.greenBorder
              : null,
          ]}
          onPress={() => handlePress(request)}>
          <View style={styles.userContainer}>
            <Image
              source={{uri: user?.user?.userImage}}
              style={styles.userImage}
            />
            <Text style={styles.userName}>{request.username}</Text>
          </View>
          <Text style={styles.text}>
            {t('Direction')}:{' '}
            {t(`${request.departureCity}-${request.arrivalCity}`)}
          </Text>
        </TouchableOpacity>
      ))
    ) : (
      <Text>{t('No new requests.')}</Text>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      {modalVisible && selectedRequest && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('Request from')}: {selectedRequest.userFname}{' '}
              {selectedRequest.userLname}
            </Text>
            <Text style={styles.modalText}>
              {t('Direction')}: {selectedRequest.departureCity} →{' '}
              {selectedRequest.arrivalCity}
            </Text>
            <Text style={styles.modalText}>
              {t('Date/Time')}:{' '}
              {new Date(selectedRequest.dataTime).toLocaleString('bg-BG')}
            </Text>
            <Text style={[styles.modalText, {marginTop: 10}]}>
              {t('Comment')}:
            </Text>
            <Text style={styles.modalComment}>
              "{selectedRequest.requestComment || t('No comment provided.')}"
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: '#007AFF'}]}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('UserDetails', {
                  userId: selectedRequest.userID,
                });
              }}>
              <Text style={styles.modalButtonText}>
                ℹ️ {t('More info about')} {selectedRequest.username}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#4CAF50'}]}
                onPress={() => {
                  setModalVisible(false);
                  sendRouteResponse(selectedRequest, true);
                }}>
                <Text style={styles.modalButtonText}>✅ {t('Approve')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#5a120dff'}]}
                onPress={() => {
                  setModalVisible(false);
                  sendRouteResponse(selectedRequest, false);
                }}>
                <Text style={styles.modalButtonText}>❌ {t('Reject')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: '#888'}]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>🔙 {t('Back')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <Image
          source={require('../../../images/routes2-background.jpg')}
          style={styles.backgroundImage}
        />
        <View style={styles.container}>
          <Text style={styles.headerText}>{t('Inquiries')}:</Text>
          <Button title="🔄 Refresh" onPress={fetchAndSetRequests} />
          {renderRoutes()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {flex: 1},
  scrollViewContainer: {flexGrow: 1},
  container: {flex: 1, alignItems: 'flex-start', position: 'relative'},
  headerText: {fontWeight: 'bold', fontSize: 24, paddingBottom: 10},
  requestContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    elevation: 3,
  },
  migratingGreenBorder: {borderColor: 'red', borderWidth: 2},
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    zIndex: -1,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 18,
    paddingBottom: 10,
    color: '#1b1c1e',
    alignSelf: 'center',
  },
  greenBorder: {borderColor: 'green', borderWidth: 2},
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  userName: {fontWeight: 'bold'},
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 2,
  },
  modalComment: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#333',
    marginTop: 5,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RouteRequestScreen;
