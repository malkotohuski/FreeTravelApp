import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRouteContext } from '../../context/RouteContext';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000'; // JSON server
const api = axios.create({
    baseURL: API_BASE_URL,
});

function RouteRequestScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    //const { username, userFname, userLname, userEmail, departureCity, arrivalCity, routeId } = route.params;
    const { requests, refreshUserData } = useRouteContext();
    const [routeRequests, setRouteRequests] = useState([]);
    const requestUserFirstName = user?.user?.fName;
    const requestUserLastName = user?.user?.lName;
    const userNow = user?.user?.id;
    const loginUser = user?.user?.username;

    const requesterUsername = user?.user?.username;
    const requestUserEmail = user?.user?.email;
    //work!!!

     useEffect(() => {
            const fetchNotifications = async () => {
                try {
                    if (!loginUser) {
                        console.error('No logged-in username found.');
                        return;
                    }
    
                    // Извличане на всички нотификации
                    const response = await api.get('/notifications');
    
                    // Филтриране на нотификациите за логнатия потребител
                    const userNotifications = response.data.filter(
                        notification => notification.requester.username === loginUser && !notification.read
                    );
    
                    // Актуализация на броя нотификации
                    setNotificationCount(userNotifications.length > 9 ? '9+' : userNotifications.length);
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                }
            };
    
            fetchNotifications();
        }, [loginUser]);

    const getRequestsForCurrentUser = () => {

        return requests.filter(request => {

            if (request.userRouteId === userNow) {
                const currentDate = new Date();
                return new Date(request.dataTime) >= currentDate;
            }
            return false;
        });
    };

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                await refreshUserData(); // Презареждане на заявките от сървъра
                setRouteRequests(getRequestsForCurrentUser()); // Обновяване на списъка с заявки
            };
    
            fetchData();
        }, [requests]) // Изпълнява се при промяна в requests
    );

    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        let interval;

        if (isMigrating) {
            interval = setInterval(() => {
                setIsMigrating((prev) => !prev);
            }, 500); // Промяна на стиловете на всеки 500 милисекунди
        }

        return () => {
            clearInterval(interval);
        };
    }, [isMigrating]);

    const handlePress = async (request) => {
        setIsMigrating(true);
        Alert.alert(
            `${t('There is a request from:')} ${request.userFname} ${request.userLname}`,
            t('Do you want to approve the request?'),
            [
                {
                    text: t('Yes'), onPress: async () => {
                        try {
                            const emailResponse = await api.post('/send-request-to-email', {
                                email: request.userEmail,
                                text: t(`Your request has been approved by: ${requestUserFirstName} ${requestUserLastName}.`),
                            });

                            const response = await api.post('/send-request-to-user', {
                                requestingUser: {
                                    username: user?.user?.username,
                                    userFname: user?.user?.fName,
                                    userLname: user?.user?.lName,
                                    userEmail: requestUserEmail,
                                    userID: user?.user?.id,
                                    userRouteId: route.params.userId,
                                    departureCity: route.params.departureCity,
                                    arrivalCity: route.params.arrivalCity,
                                    routeId: route.params.routeId,
                                    dataTime: route.params.selectedDateTime
                                },
                            });;

                                // Съхранение на нотификация
                                await api.post('/notifications', {
                                    recipient: loginUser, // Потребител, който е създал маршрута
                                    message: t(`You have a new request for your route from: ${requesterUsername}.
                                                About the route: ${departureCity}-${arrivalCity}.
                                                For date: ${dataTime}`),
                                    routeId,
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

                            console.log('Email Response:', emailResponse);
                            Alert.alert('Success', 'Trip request sent successfully.');

                            /* const response = await api.post('/send-request-to-user', {
                                // Тук можеш да използваш request.requestingUser.userEmail за да направиш заявката
                            });
                            // Handle the response from the server if needed
                            console.log('Route Approval Response:', response); */

                            // After handling the request, you can navigate back to the previous screen
                            navigation.navigate('Home');
                        } catch (error) {
                            console.error('Error while handling request:', error);
                            Alert.alert('Error', 'An error occurred while handling the request.');
                        } finally {
                            setIsMigrating(false);
                        }
                    },
                },
                { text: t('No'), onPress: () => setIsMigrating(false), style: 'cancel' }
            ],
            { cancelable: false }
        );
    };

    const renderRoutes = () => {
        const requestsForCurrentUser = getRequestsForCurrentUser();

        const renderedRoutes = requestsForCurrentUser.map((request) => (
            <TouchableOpacity
                key={request.id}
                style={[
                    styles.requestContainer,
                    request.requestingUser ? (isMigrating ? styles.migratingGreenBorder : styles.greenBorder) : null
                ]}
                onPress={() => handlePress(request)}
            >
                <View style={styles.userContainer}>
                    <Image source={{ uri: user?.user?.userImage }} style={styles.userImage} />
                    <Text style={styles.userName}>{request.username}</Text>
                </View>
                <Text style={styles.text}>
                    {t('Direction')}: {t(`${request.departureCity}-${request.arrivalCity}`)}
                </Text>
            </TouchableOpacity>
        ));

        return renderedRoutes.length > 0 ? renderedRoutes : <Text>{t('No new requests.')}</Text>;
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                <Image
                    source={require('../../../images/routes2-background.jpg')}
                    style={styles.backgroundImage}
                />
                <View style={styles.container}>
                    <Text style={styles.headerText}>{t('Route Requests')}:</Text>
                    {routeRequests.length > 0 ? (
                        <View>
                            {renderRoutes()}
                        </View>
                    ) : (
                        <Text>{t('There are no requests for this route.')}</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    scrollViewContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        alignItems: 'flex-start',
        position: 'relative',
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 24,
        paddingBottom: 10,
    },
    requestContainer: {
        margin: 10,
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 15,
        elevation: 3,
    },
    migratingGreenBorder: {
        borderColor: 'red',
        borderWidth: 2,
    },
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
        alignSelf: 'center'
    },
    greenBorder: {
        borderColor: 'green',
        borderWidth: 2,
    },
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
    userName: {
        fontWeight: 'bold',
    },
});

export default RouteRequestScreen;
