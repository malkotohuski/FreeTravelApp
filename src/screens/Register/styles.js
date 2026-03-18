import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: 'grey',
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
    marginBottom: 15,
    marginRight: 20,
    zIndex: 1,
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
    fontWeight: 'bold',
  },
  title: {
    fontSize: 34,
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#f1f1f1',
    textAlign: 'center',
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
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  loginButtons: {
    width: 250, // Еднаква ширина
    height: 50, // Еднаква височина
    backgroundColor: '#f4511e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f1f1f1',
    justifyContent: 'center', // Центриране по вертикала
    alignItems: 'center', // Центриране по хоризонтала
    marginVertical: 8, // Разстояние между бутоните
  },
  textButtons: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  languageSwitchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  languageButton: {
    alignItems: 'center',
  },
  flagImage: {
    width: 50, // Adjust the size as needed
    height: 50, // Adjust the size as needed
    borderRadius: 25, // Half of the width and height to make it round
    marginBottom: 5, // Adjust the spacing as needed
  },
  languageText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#FAFAFA',
  },
});
