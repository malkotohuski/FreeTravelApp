import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor: 'grey'
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
    },
    profilePictureContainer: {
        alignItems: 'center',
        marginBottom: 16,
        fontSize: 20,
        fontWeight: 'bold',
    },
    topRight: {
        position: 'absolute',
        top: 15,
        right: 0,
        marginBottom: 15, // Adjust this value as needed for spacing
        marginRight: 20, // Adjust this value as needed for spacing
        zIndex: 1, // To ensure it appears on top of other elements
    },
    profilePicture: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    addPhotoText: {
        fontSize: 16,
        color: '#F5FDFE',
        textDecorationLine: 'underline',
        fontWeight: 'bold'
    },
    title: {
        fontSize: 34,
        marginBottom: 30,
        fontWeight: 'bold',
        color: '#f1f1f1'
    },
    input: {
        width: 200,
        height: 40,
        borderWidth: 1,
        borderColor: 'white',
        marginBottom: 10,
        paddingHorizontal: 10,
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    buttonsContent: {
        margin: 50,
        width: 250,
    },
    loginButtons: {
        alignItems: 'center',
        backgroundColor: '#f4511e',
        padding: 10,
        marginBottom: 1,
        fontSize: 16,
        fontWeight: 'bold',
        borderWidth: 2,
        borderColor: '#f1f1f1',
        borderRadius: 8,
    },
    textButtons: {
        fontSize: 20,
        color: '#010101',
        fontWeight: '800',
    },
});