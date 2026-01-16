import React, {useState, useTransition, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ToastAndroid,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import axios from 'axios';
import ImagePicker from 'react-native-image-crop-picker';
import {useAuth} from '../../context/AuthContext';
import {useFocusEffect} from '@react-navigation/native';

const API_BASE_URL = 'http://10.0.2.2:3000';
const api = axios.create({
  baseURL: API_BASE_URL,
});

const AccountSettings = ({navigation}) => {
  const {user, updateProfilePicture, updateUserData} = useAuth();
  const [profilePicture, setProfilePicture] = useState(user?.userImage || null);

  const {t} = useTranslation();
  const [fName, setFname] = useState(user?.fName || '');
  const [lName, setLname] = useState(user?.lName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const noImage = require('../../../images/emptyUserImage.png');

  useFocusEffect(
    useCallback(() => {
      // Нулираме полетата за парола при всяко влизане в екрана
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, []),
  );

  const handleImagePicker = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
      });

      if (image?.path) {
        setProfilePicture(image.path);
        setPhotoChanged(true); // вече използваме това за промяна
      }
    } catch (error) {
      console.log('ImagePicker Error: ', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const originalFname = user?.fName || '';
      const originalLname = user?.lName || '';
      const originalImage = user?.userImage || null;

      const changes = {};

      // Имена
      if (fName !== originalFname) changes.fName = fName;
      if (lName !== originalLname) changes.lName = lName;

      // Снимка
      if (photoChanged && profilePicture !== originalImage) {
        changes.userImage = profilePicture;
      }

      // Парола
      if (newPassword || confirmPassword) {
        if (!currentPassword) {
          Alert.alert(t('Error'), t('Please enter current password'));
          return;
        }
        if (newPassword !== confirmPassword) {
          Alert.alert(t('Error'), t('Passwords do not match'));
          return;
        }
        if (newPassword.length < 8) {
          Alert.alert(t('Error'), t('Password must be at least 8 characters'));
          return;
        }
        changes.currentPassword = currentPassword;
        changes.newPassword = newPassword;
      }

      // Ако няма промени
      if (Object.keys(changes).length === 0) {
        Platform.OS === 'android'
          ? ToastAndroid.show(t('No changes to save'), ToastAndroid.SHORT)
          : Alert.alert(t('Info'), t('No changes to save'));
        return;
      }

      // PATCH заявка
      const response = await api.patch('/user-changes', {
        userId: user.id,
        ...changes,
      });

      // Обновяване на контекст
      updateUserData({
        fName: response.data.user.fName,
        lName: response.data.user.lName,
        userImage: response.data.user.userImage,
      });

      // Reset полета
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPhotoChanged(false);
      Keyboard.dismiss();

      Alert.alert(t('Success'), t('Changes saved successfully'), [
        {text: 'OK', onPress: () => navigation.navigate('AccountManager')},
      ]);
    } catch (error) {
      console.log('User changes error:', error.response?.data);
      Alert.alert(
        t('Error'),
        error.response?.data?.error ||
          t('There was an error while saving changes'),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../../images/acountSettings.png')}
        style={styles.backgroundImage}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1, width: '100%'}}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.userInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('Username')}:</Text>
              <Text style={styles.value}>{user?.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('Full Name')}:</Text>
              <Text style={styles.value}>
                {user?.fName} {user?.lName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('Email')}:</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.userInfoContainerPhoto}>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={styles.profilePictureContainer}>
              <Image
                source={profilePicture ? {uri: profilePicture} : noImage}
                style={styles.profilePicture}
              />
            </TouchableOpacity>
            <Text style={styles.photoText}>{t('Change Photo')}</Text>
          </View>
          <View style={styles.rowInputsContainer}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.inputLabel}>{t('First Name')}</Text>
              <TextInput
                style={styles.input}
                value={fName}
                onChangeText={setFname}
                placeholder={t('Enter first name')}
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={styles.inputLabel}>{t('Last Name')}</Text>
              <TextInput
                style={styles.input}
                value={lName}
                onChangeText={setLname}
                placeholder={t('Enter last name')}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('Current password')}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('New password')}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('Confirm new password')}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          <View style={styles.saveContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveChanges}>
              <Text style={styles.buttonText}>{t('Save changes')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  userInfoContainer: {
    width: '90%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userInfoContainerPhoto: {
    alignItems: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    flexShrink: 1,
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '90%',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveContainer: {
    width: '90%',
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#f4511e',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%', // същото като другите input контейнери
    marginBottom: 15,
  },
  halfInputContainer: {
    width: '48%', // двата input-а се побират на един ред
  },
});

export default AccountSettings;
