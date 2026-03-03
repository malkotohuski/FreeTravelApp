import React, {useState, useCallback} from 'react';
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
} from 'react-native';
import {useTranslation} from 'react-i18next';
import api from '../../api/api';
import ImagePicker from 'react-native-image-crop-picker';
import {useAuth} from '../../context/AuthContext';
import {useFocusEffect} from '@react-navigation/native';

const AccountSettings = () => {
  const {user, updateUserData} = useAuth();
  const {t} = useTranslation();

  const [profilePicture, setProfilePicture] = useState(user?.userImage || null);
  const [fName, setFname] = useState(user?.fName || '');
  const [lName, setLname] = useState(user?.lName || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const noImage = require('../../../images/emptyUserImage.png');

  useFocusEffect(
    useCallback(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, []),
  );

  // ======================
  // AVATAR
  // ======================
  const handleImagePicker = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
      });

      if (!image?.path) return;

      const formData = new FormData();
      formData.append('avatar', {
        uri: image.path,
        type: image.mime,
        name: 'avatar.jpg',
      });

      const response = await api.patch('/api/users/avatar', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      // 🔹 Взимаме и новия public_id, ако сървърът го връща
      const {userImage, userImagePublicId} = response.data.user;

      // 🔹 Актуализираме контекста
      updateUserData({userImage, userImagePublicId});

      // 🔹 Актуализираме локалния state
      setProfilePicture(userImage);

      Alert.alert(t('Success'), t('Avatar updated successfully'));
    } catch (error) {
      Alert.alert(
        t('Error'),
        error.response?.data?.error || t('Avatar update failed'),
      );
    }
  };

  // ======================
  // PROFILE DATA
  // ======================
  const handleSaveChanges = async () => {
    try {
      const originalFname = user?.fName || '';
      const originalLname = user?.lName || '';

      let somethingChanged = false;

      // 🔹 Update names
      if (fName !== originalFname || lName !== originalLname) {
        await api.patch('/api/users/profile', {
          fName,
          lName,
        });

        updateUserData({fName, lName});
        somethingChanged = true;
      }

      // 🔹 Update password
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

        await api.patch('/api/users/password', {
          currentPassword,
          newPassword,
        });

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        somethingChanged = true;
      }

      if (!somethingChanged) {
        Alert.alert(t('Info'), t('No changes to save'));
        return;
      }

      Alert.alert(t('Success'), t('Changes saved successfully'));
    } catch (error) {
      console.log('User changes error:', error.response?.data);

      Alert.alert(
        t('Error'),
        error.response?.data?.error || t('Something went wrong'),
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* USER INFO */}
          <View style={styles.userInfoContainer}>
            <InfoRow label={t('Username')} value={user?.username} />
            <InfoRow
              label={t('Full Name')}
              value={`${user?.fName} ${user?.lName}`}
            />
            <InfoRow label={t('Email')} value={user?.email} />
          </View>

          {/* AVATAR */}
          <View style={styles.userInfoContainerPhoto}>
            <TouchableOpacity onPress={handleImagePicker}>
              <Image
                source={profilePicture ? {uri: profilePicture} : noImage}
                style={styles.profilePicture}
              />
            </TouchableOpacity>
            <Text style={styles.photoText}>{t('Change Photo')}</Text>
          </View>

          {/* PROFILE */}
          <TwoInputs
            leftLabel={t('First Name')}
            leftValue={fName}
            leftChange={setFname}
            rightLabel={t('Last Name')}
            rightValue={lName}
            rightChange={setLname}
          />

          <PrimaryButton
            label={t('Save Profile')}
            onPress={handleSaveChanges}
          />

          {/* PASSWORD */}
          <PasswordInput
            label={t('Current password')}
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordInput
            label={t('New password')}
            value={newPassword}
            onChange={setNewPassword}
          />
          <PasswordInput
            label={t('Confirm new password')}
            value={confirmPassword}
            onChange={setConfirmPassword}
          />

          <PrimaryButton
            label={t('Change Password')}
            onPress={handleSaveChanges}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ===================== COMPONENTS ===================== */

const InfoRow = ({label, value}) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const PasswordInput = ({label, value, onChange}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      secureTextEntry
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const TwoInputs = ({
  leftLabel,
  leftValue,
  leftChange,
  rightLabel,
  rightValue,
  rightChange,
}) => (
  <View style={styles.rowInputsContainer}>
    <View style={styles.halfInputContainer}>
      <Text style={styles.inputLabel}>{leftLabel}</Text>
      <TextInput
        style={styles.input}
        value={leftValue}
        onChangeText={leftChange}
      />
    </View>
    <View style={styles.halfInputContainer}>
      <Text style={styles.inputLabel}>{rightLabel}</Text>
      <TextInput
        style={styles.input}
        value={rightValue}
        onChangeText={rightChange}
      />
    </View>
  </View>
);

const PrimaryButton = ({label, onPress}) => (
  <View style={styles.saveContainer}>
    <TouchableOpacity style={styles.saveButton} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  </View>
);

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {flex: 1},
  backgroundImage: {position: 'absolute', width: '100%', height: '100%'},
  scrollContent: {alignItems: 'center', paddingBottom: 40},
  userInfoContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  userInfoContainerPhoto: {alignItems: 'center', marginVertical: 20},
  profilePicture: {width: 120, height: 120, borderRadius: 60},
  photoText: {fontSize: 16, fontWeight: 'bold'},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  label: {fontWeight: '600'},
  value: {flexShrink: 1},
  inputContainer: {width: '90%', marginBottom: 15},
  inputLabel: {fontWeight: '600', marginBottom: 5},
  input: {backgroundColor: '#fff', padding: 12, borderRadius: 8},
  rowInputsContainer: {flexDirection: 'row', width: '90%', gap: 10},
  halfInputContainer: {flex: 1},
  saveContainer: {width: '90%', marginVertical: 15},
  saveButton: {backgroundColor: '#f4511e', padding: 15, borderRadius: 10},
  buttonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
});

export default AccountSettings;
