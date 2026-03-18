import Icon from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import api from '../../api/api';
import {useTranslation} from 'react-i18next';
import styles from './styles';

export default function ResetPassword({navigation}) {
  const {t} = useTranslation();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  useFocusEffect(
    useCallback(() => {
      return () => {
        // 🧹 чистим ВСИЧКО при напускане
        setEmail('');
        setCode('');
        setNewPassword('');
        setCodeSent(false);
        setLoading(false);
      };
    }, []),
  );

  const sendResetCode = async () => {
    if (!email.trim()) {
      Alert.alert(t('Error'), t('Please enter your email'));
      return;
    }

    try {
      setLoading(true);

      await api.post('/api/auth/forgot-password', {email});

      // ✅ ВИНАГИ показваме успех
      Alert.alert(
        t('Success'),
        t('If an account with this email exists, a reset code has been sent.'),
      );

      setCodeSent(true);
    } catch (err) {
      // ❗ пак показваме същото
      Alert.alert(
        t('Success'),
        t('If an account with this email exists, a reset code has been sent.'),
      );

      setCodeSent(true);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!code || code.length !== 6) {
      Alert.alert(t('Error'), t('Invalid code'));
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('Error'), t('Password must be at least 8 characters'));
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', {
        email,
        code,
        newPassword,
      });

      Alert.alert(t('Success'), t('Password reset successful'));

      // 🧹 ръчно чистене (за сигурност)
      setEmail('');
      setCode('');
      setNewPassword('');
      setCodeSent(false);

      navigation.goBack();
    } catch (err) {
      Alert.alert(t('Error'), t('Invalid code or expired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={handleGoBack}
        style={styles.backIconButton}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Icon name="arrow-back" size={26} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>{t('Reset password')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('Email')}
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
      />
      {!codeSent ? (
        <TouchableOpacity
          style={styles.mainButton}
          onPress={sendResetCode}
          disabled={!email || loading}>
          <Text style={styles.buttonText}>
            {loading ? t('Please wait...') : t('Send code')}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('6-digit code')}
            maxLength={6}
            placeholderTextColor="#fff"
            keyboardType="numeric"
            value={code}
            onChangeText={setCode}
          />

          <TextInput
            style={styles.input}
            placeholder={t('New password')}
            placeholderTextColor="#fff"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity
            style={styles.mainButton}
            onPress={resetPassword}
            disabled={loading}>
            <Text style={styles.buttonText}>{t('Reset password')}</Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
