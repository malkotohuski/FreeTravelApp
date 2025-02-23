import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useRouteContext } from './RouteContext';
import { useAuth } from '../Authentication/AuthContext';


function Confirm() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const routeContext = useRouteContext();
    const { userRoutes, addRoute } = routeContext;
    const { user } = useAuth();

    // State to manage success message
    const [successMessage, setSuccessMessage] = useState('');

    // Routes data:
    const route = useRoute();
    const selectedDateTime = route.params.selectedDateTime ? new Date(route.params.selectedDateTime) : null; // Конвертиране обратно в Date

    if (!selectedDateTime) {
        console.error('selectedDateTime is null or undefined in Confirm screen');
    }

    const selectedVehicle = route.params.selectedVehicle;
    const registrationNumber = route.params.registrationNumber;
    const departureCity = route.params.departureCity;
    const departureStreet = route.params.departureStreet;
    const departureNumber = route.params.departureNumber;
    const arrivalCity = route.params.arrivalCity;
    const arrivalStreet = route.params.arrivalStreet;
    const arrivalNumber = route.params.arrivalNumber;
    const routeId = route.params.id;
    const user_id = route.params.userId;

    // User data:
    const userId = user?.user?.id;
    const username = user?.user?.username;
    const userFname = user?.user?.fName;
    const userLname = user?.user?.lName;
    const userEmail = user?.user?.email;

    // Buttons logic:
    const showConfirmButton = route.params.showConfirmButton !== undefined ? route.params.showConfirmButton : true;
    const showChangesButton = route.params.showChangesButton !== undefined ? route.params.showChangesButton : true;
    const showBackButton = route.params.showBackButton !== undefined ? route.params.showBackButton : false;
    const routeRequestButton = route.params.showBackButton !== undefined ? route.params.showBackButton : false;

    const handleGoBack = () => {
        navigation.navigate('Vehicle'); // Go back to the previous screen
    };

    const handleConfirm = async () => {
        if (isSubmitting) {
            console.warn("Duplicate submission attempt prevented.");
            return; // Предотвратява повторно натискане на бутона
        }

        setIsSubmitting(true); // Деактивира бутон веднага след натискане

        const newRoute = {
            selectedVehicle,
            registrationNumber,
            selectedDateTime,
            departureCity,
            departureStreet,
            departureNumber,
            arrivalCity,
            arrivalStreet,
            arrivalNumber,
            userId,
            username,
            userFname,
            userLname,
            userEmail,
            routeId,
            user_id,
        };

        try {
            const response = await fetch('http://10.0.2.2:3000/create-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ route: newRoute }),
            });

            if (response.ok) {
                console.log('Route created successfully');
                const responseData = await response.json();
                addRoute(responseData.route); // Записва маршрута в контекста
                setSuccessMessage(t('The route has been created!'));

                // Навигиране към "View routes" след успешното създаване
                navigation.navigate('View routes');
            } else {
                const errorData = await response.json();
                console.error('Failed to create route:', errorData.error);
            }
        } catch (error) {
            console.error('Error creating route:', error);
        } finally {
            setIsSubmitting(false); // Разрешава натискане на бутона отново след завършване
        }
    };

    const handlerBackRoutes = () => {
        navigation.navigate('View routes');
    };

    return (
        <SafeAreaView style={styles.mainContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.container}>
                    <Image
                        source={require('../../images/d8.png')}
                        style={styles.backgroundImage}
                    />
                    <Text style={styles.headerText}>{t('Review')}:</Text>
                    <Text style={styles.text}>{t('Username')}: {username}</Text>
                    <Text style={styles.text}>{t('Names')}: {userFname} {userLname}</Text>
                    <Text style={styles.text}>{t('Time and date of departure')}: {String(selectedDateTime.toLocaleString())}</Text>

                    {/* Departure Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeaderText}>{t('Departure')}:</Text>
                        <Text style={styles.text}>{t('Town/Village')}: {departureCity}</Text>
                        <Text style={styles.text}>{t('Street')}: {departureStreet} {departureNumber}</Text>
                    </View>

                    {/* Arrival Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionHeaderText}>{t('Arrival')}:</Text>
                        <Text style={styles.text}>{t('Town/Village')}: {arrivalCity}</Text>
                        <Text style={styles.text}>{t('Street')}: {arrivalStreet} {arrivalNumber}</Text>
                    </View>

                    {showChangesButton && (
                        <TouchableOpacity style={styles.button} onPress={handleGoBack}>
                            <Text style={styles.buttonText}>{t('Make changes')}</Text>
                        </TouchableOpacity>
                    )}
                    {showConfirmButton && !isSubmitting && (
                        <TouchableOpacity
                            style={styles.buttonConfirm}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.buttonText}>{t('Confirm')}</Text>
                        </TouchableOpacity>
                    )}
                    {showBackButton && (
                        <TouchableOpacity style={styles.buttonConfirm} onPress={handlerBackRoutes}>
                            <Text style={styles.buttonText}>{t('Back')}</Text>
                        </TouchableOpacity>
                    )}
                    {/* Success message */}
                    {successMessage && (
                        <Text style={styles.successMessage}>{successMessage}</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center', // Center horizontally
        backgroundColor: 'grey',
        padding: 0, // Ensure no padding
        margin: 0, // Ensure no margin
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
        top: 0, // Align image to the top
        left: 0, // Align image to the left
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 24,
        paddingBottom: 10,
        color: '#121213',
        borderBottomWidth: 3, // Border bottom for header text
        borderBottomColor: '#121213', // Border color
        textAlign: 'center', // Center text
    },
    text: {
        fontWeight: 'bold',
        fontSize: 18,
        paddingBottom: 10,
        color: '#010101',
        borderBottomWidth: 2, // Border bottom for regular text
        borderBottomColor: '#121213', // Border color
        textAlign: 'center', // Center text
    },
    button: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e74c3c',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        width: '90%',
        borderRadius: 10,
    },
    buttonConfirm: {
        marginTop: 10,
        padding: 15,
        backgroundColor: '#27ae60',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        width: '90%',
        borderRadius: 10,
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6', // Сив цвят за деактивирания бутон
    },
    buttonText: {
        color: '#F1F1F1',
        fontSize: 16,
        textAlign: 'center', // Center text
    },
    sectionContainer: {
        marginTop: 10,
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 10,
        width: '90%',
        alignItems: 'center', // Center section content horizontally
    },
    sectionHeaderText: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#121213',
        marginBottom: 5,
        textAlign: 'center', // Center text
    },
    successMessage: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#27ae60',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        width: '90%',
        borderRadius: 10,
        color: '#F1F1F1',
        textAlign: 'center', // Center text
    },
});

export default Confirm;
