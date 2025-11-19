import React from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';

export default function ProblemInput({value, onChangeText, maxLength = 400}) {
  const warningLimit = 350;
  const {t} = useTranslation();

  return (
    <View style={{width: '100%', marginBottom: 16}}>
      <TextInput
        style={styles.input}
        placeholder={t('Describe the problem...')}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        multiline
      />

      <Text
        style={[
          styles.counter,
          value.length >= warningLimit && {color: 'red', fontWeight: '600'},
        ]}>
        {value.length} / {maxLength}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
    minHeight: 120,
  },
  counter: {
    textAlign: 'right',
    marginTop: 5,
    color: '#888',
  },
});
