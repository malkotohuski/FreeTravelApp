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
import api from '../../api/api';

const colors = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#3f51b5',
  '#2196f3',
  '#009688',
  '#4caf50',
  '#ff9800',
  '#795548',
  '#607d8b',
];

function getAvatarColor(username) {
  if (!username) return '#777';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
}

function RouteRequestScreen({route, navigation}) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {requests, refreshUserData} = useRouteContext();
  const [routeRequests, setRouteRequests] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const requestUserFirstName = user?.fName;
  const requestUserLastName = user?.lName;
  const userNow = user?.id;
  const loginUser = user?.username;
  const requesterUsername = user?.username;
  const requestUserEmail = user?.email;
  const requestUserID = user?.userID;

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
      await api.post(`/requests/${request.id}/decision`, {
        decision: isApproved ? 'approved' : 'rejected',
        currentUserId: userNow,
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
            <View
              style={[
                styles.initialsContainer,
                {backgroundColor: getAvatarColor(request.username)},
              ]}>
              <Text style={styles.initialsText}>
                {request.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
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
  container: {
    flex: 1,
    alignItems: 'flex-start',
    padding: 20,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 15,
    color: '#0a0a0aff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  requestContainer: {
    width: '100%', // добавено, за да са еднакви
    marginVertical: 8,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    fontWeight: '600',
    fontSize: 16,
    color: '#222',
  },
  greenBorder: {borderColor: '#4CAF50', borderWidth: 2},
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-start', // за да не се разтягат елементите
  },
  userImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  initialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#333',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#444',
    marginVertical: 3,
  },
  modalComment: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 8,
    paddingLeft: 5,
    borderLeftWidth: 2,
    borderLeftColor: '#ccc',
  },

  modalButtons: {
    marginTop: 15,
    flexDirection: 'column',
    gap: 10,
  },

  modalButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RouteRequestScreen;
