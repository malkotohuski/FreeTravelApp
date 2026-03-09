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
  Pressable,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import api from '../../api/api';
import ImagePicker from 'react-native-image-crop-picker';
import {useAuth} from '../../context/AuthContext';
import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from '../../theme/useTheme';

const AccountSettings = () => {
  const {user, updateUserData} = useAuth();
  const {t} = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

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

  // ====== AVATAR ======
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

      const {userImage, userImagePublicId} = response.data.user;
      updateUserData({userImage, userImagePublicId});
      setProfilePicture(userImage);
      Alert.alert(t('Success'), t('Avatar updated successfully'));
    } catch (error) {
      Alert.alert(
        t('Error'),
        error.response?.data?.error || t('Avatar update failed'),
      );
    }
  };

  // ====== PROFILE SAVE ======
  const handleSaveChanges = async () => {
    try {
      const originalFname = user?.fName || '';
      const originalLname = user?.lName || '';
      let somethingChanged = false;

      // Update names
      if (fName !== originalFname || lName !== originalLname) {
        await api.patch('/api/users/profile', {fName, lName});
        updateUserData({fName, lName});
        somethingChanged = true;
      }

      // Update password
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
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.gradient[0]}]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1, width: '100%'}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* USER INFO */}
          <View style={styles.userInfoContainer}>
            <InfoRow
              label={t('Username')}
              value={user?.username}
              styles={styles}
            />
            <InfoRow
              label={t('Full Name')}
              value={`${user?.fName} ${user?.lName}`}
              styles={styles}
            />
            <InfoRow label={t('Email')} value={user?.email} styles={styles} />
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

          {/* PROFILE NAMES */}
          <TwoInputs
            leftLabel={t('First Name')}
            leftValue={fName}
            leftChange={setFname}
            rightLabel={t('Last Name')}
            rightValue={lName}
            rightChange={setLname}
            styles={styles}
          />

          <PrimaryButton
            label={t('Save Profile')}
            onPress={handleSaveChanges}
            styles={styles}
          />

          {/* PASSWORD */}
          <PasswordInput
            label={t('Current password')}
            value={currentPassword}
            onChange={setCurrentPassword}
            styles={styles}
          />
          <PasswordInput
            label={t('New password')}
            value={newPassword}
            onChange={setNewPassword}
            styles={styles}
          />
          <PasswordInput
            label={t('Confirm new password')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            styles={styles}
          />

          <PrimaryButton
            label={t('Change Password')}
            onPress={handleSaveChanges}
            styles={styles}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ===================== COMPONENTS ===================== */

const InfoRow = ({label, value, styles}) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const TwoInputs = ({
  leftLabel,
  leftValue,
  leftChange,
  rightLabel,
  rightValue,
  rightChange,
  styles,
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

const PasswordInput = ({label, value, onChange, styles}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      secureTextEntry={true}
    />
  </View>
);

const PrimaryButton = ({label, onPress, styles}) => (
  <View style={styles.saveContainer}>
    <Pressable style={styles.saveButton} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  </View>
);

/* ===================== STYLES ===================== */

const createStyles = theme =>
  StyleSheet.create({
    container: {flex: 1},
    scrollContent: {alignItems: 'center', paddingBottom: 40},
    userInfoContainer: {
      width: '90%',
      backgroundColor: theme.cardBackground,
      padding: 15,
      borderRadius: 10,
      marginTop: 10,
    },
    userInfoContainerPhoto: {alignItems: 'center', marginVertical: 20},
    profilePicture: {width: 100, height: 100, borderRadius: 60},
    photoText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      textAlign: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 5,
    },
    label: {fontWeight: '600'},
    value: {flexShrink: 1},
    inputContainer: {width: '90%', marginBottom: 15},
    inputLabel: {fontWeight: '600', marginBottom: 5, color: theme.textPrimary},
    input: {
      backgroundColor: theme.inputBackground,
      color: theme.textPrimary,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    rowInputsContainer: {flexDirection: 'row', width: '90%', gap: 10},
    halfInputContainer: {flex: 1},
    saveContainer: {width: '100%', marginVertical: 15}, // бутон на пълна ширина
    saveButton: {
      backgroundColor: theme.primaryButton,
      padding: 15,
      borderRadius: 10,
    },
    buttonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  });

export default AccountSettings;
