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
import axios from 'axios';
import {useTranslation} from 'react-i18next';
import styles from './styles';

const API_BASE_URL = 'http://10.0.2.2:3000';

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
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/forgot-password`, {
        email,
      });

      setCodeSent(true);
      Alert.alert(t('Success'), t('Reset code sent to your email'));
    } catch (err) {
      Alert.alert(t('Error'), t('Email not found'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/reset-password`, {
        email,
        code,
        newPassword,
      });

      Alert.alert(t('Success'), t('Password reset successful'));
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
          disabled={loading}>
          <Text style={styles.buttonText}>{t('Send code')}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('6-digit code')}
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
