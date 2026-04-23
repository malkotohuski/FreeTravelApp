import React, {useState, useEffect, useCallback, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {useRouteContext} from '../../context/RouteContext';
import api from '../../api/api';
import {useTheme} from '../../theme/useTheme';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState('');

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    console.log('ROUTE PARAMS:', route.params);
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('SCREEN FOCUSED -> REFRESH');
      refreshUserData();
    }, []),
  );

  useEffect(() => {
    const filtered = requests.filter(
      request => request.toUserId === user.id && request.status === 'pending',
    );
    setRouteRequests(filtered);
  }, [requests, user.id]);

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

  const handleDecision = async (requestId, decision) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await api.post(`/api/requests/${requestId}/decision`, {
        decision,
        personalMessage: decisionMessage,
      });

      if (decision === 'approved') {
        navigation.navigate('Home');
      }

      // Remove the processed request locally.
      setRouteRequests(prev => prev.filter(r => r.id !== requestId));

      setDecisionMessage('');

      Alert.alert(
        t('Success'),
        decision === 'approved'
          ? t('Request approved.')
          : t('Request rejected.'),
      );

      await refreshUserData();
    } catch (err) {
      console.error('Decision error:', err);
      const message =
        err.response?.data?.error || t('Failed to process request.');
      Alert.alert(t('Error'), message);
    } finally {
      setIsProcessing(false);
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
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
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
            <Text style={[styles.userName, {color: theme.textPrimary}]}>
              {request.username}
            </Text>
          </View>
          <Text style={[styles.text, {color: theme.textSecondary}]}>
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
    <SafeAreaView style={{flex: 1, backgroundColor: theme.gradient[0]}}>
      <Modal
        transparent
        visible={modalVisible && !!selectedRequest}
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
        }}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={Keyboard.dismiss}
            />
            <TouchableWithoutFeedback accessible={false}>
              <View
                style={[
                  styles.modalContainer,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.cardBorder,
                  },
                ]}>
                {selectedRequest && (
                  <>
                    <Text
                      style={[styles.modalTitle, {color: theme.textPrimary}]}>
                      {t('Request from')}: {selectedRequest.userFname}{' '}
                      {selectedRequest.userLname}
                    </Text>
                    <Text
                      style={[
                        styles.modalText,
                        {color: theme.textSecondary},
                      ]}>
                      {t('Direction')}: {selectedRequest.departureCity} -{' '}
                      {selectedRequest.arrivalCity}
                    </Text>
                    <Text
                      style={[
                        styles.modalText,
                        {color: theme.textSecondary},
                      ]}>
                      {t('Date/Time')}:{' '}
                      {new Date(selectedRequest.dataTime).toLocaleString(
                        'bg-BG',
                      )}
                    </Text>
                    <Text style={[styles.modalText, {marginTop: 10}]}>
                      {t('Comment')}:
                    </Text>
                    <Text
                      style={[
                        styles.modalComment,
                        {
                          color: theme.textSecondary,
                          borderLeftColor: theme.cardBorder,
                        },
                      ]}>
                      {`"${
                        selectedRequest.requestComment ||
                        t('No comment provided.')
                      }"`}
                    </Text>

                    <Text style={[styles.modalText, {marginTop: 15}]}>
                      {t('Personal message (optional)')}:
                    </Text>

                    <TextInput
                      style={[
                        styles.messageInput,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                          color: theme.textPrimary,
                        },
                      ]}
                      placeholder={t('Write a message...')}
                      placeholderTextColor={theme.placeholder}
                      value={decisionMessage}
                      onChangeText={setDecisionMessage}
                      multiline
                      blurOnSubmit={false}
                    />

                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        {backgroundColor: '#007AFF'},
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setModalVisible(false);
                        navigation.navigate('UserDetails', {
                          userId: selectedRequest.userID,
                        });
                      }}>
                      <Text style={styles.modalButtonText}>
                        {t('More info about')} {selectedRequest.username}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          {
                            backgroundColor: '#4CAF50',
                            opacity: isProcessing ? 0.6 : 1,
                          },
                        ]}
                        disabled={isProcessing}
                        onPress={() => {
                          Keyboard.dismiss();
                          setModalVisible(false);
                          handleDecision(selectedRequest.id, 'approved');
                        }}>
                        <Text style={styles.modalButtonText}>
                          {isProcessing ? t('Processing') : t('Approve')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          {
                            backgroundColor: '#5a120dff',
                            opacity: isProcessing ? 0.6 : 1,
                          },
                        ]}
                        disabled={isProcessing}
                        onPress={() => {
                          Keyboard.dismiss();
                          setModalVisible(false);
                          handleDecision(selectedRequest.id, 'rejected');
                        }}>
                        <Text style={styles.modalButtonText}>
                          {isProcessing ? t('Processing') : t('Reject')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.modalButton, {backgroundColor: '#888'}]}
                        onPress={() => {
                          Keyboard.dismiss();
                          setModalVisible(false);
                        }}>
                        <Text style={styles.modalButtonText}>{t('Back')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.container}>
          <Text
            style={[
              styles.headerText,
              {
                color: theme.textPrimary,
              },
            ]}>
            {t('Requests')}:
          </Text>
          {renderRoutes()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {flex: 1, justifyContent: 'flex-start'},
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
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  requestContainer: {
    width: '100%', // ÃÂ´ÃÂ¾ÃÂ±ÃÂ°ÃÂ²ÃÂµÃÂ½ÃÂ¾, ÃÂ·ÃÂ° ÃÂ´ÃÂ° Ã‘ÂÃÂ° ÃÂµÃÂ´ÃÂ½ÃÂ°ÃÂºÃÂ²ÃÂ¸
    marginVertical: 8,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    shadowColor: '#070707',
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
  messageInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
    minHeight: 60,
    textAlignVertical: 'top',
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
    justifyContent: 'flex-start', // ÃÂ·ÃÂ° ÃÂ´ÃÂ° ÃÂ½ÃÂµ Ã‘ÂÃÂµ Ã‘â‚¬ÃÂ°ÃÂ·Ã‘â€šÃ‘ÂÃÂ³ÃÂ°Ã‘â€š ÃÂµÃÂ»ÃÂµÃÂ¼ÃÂµÃÂ½Ã‘â€šÃÂ¸Ã‘â€šÃÂµ
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalKeyboardView: {
    flex: 1,
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

