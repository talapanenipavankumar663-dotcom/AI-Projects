import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  Keyboard,
} from 'react-native';
import { Theme } from '../theme/theme';

interface OTPInputProps {
  code: string;
  setCode: (code: string) => void;
  maximumLength?: number;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  code,
  setCode,
  maximumLength = 6,
  disabled = false,
}) => {
  const inputRef = useRef<TextInput>(null);

  const boxArray = new Array(maximumLength).fill(0);

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const boxDigit = (_: number, index: number) => {
    const emptyInput = '';
    const digit = code[index] || emptyInput;

    const isCurrentValue = index === code.length;
    const isLastValue = index === maximumLength - 1 && code.length === maximumLength;
    const isCodeFocused = isCurrentValue || isLastValue;

    const isFocused = !disabled && isCodeFocused;

    return (
      <View
        key={index}
        style={[
          styles.box,
          isFocused ? styles.boxFocused : null,
          digit ? styles.boxFilled : null,
          disabled ? styles.boxDisabled : null,
        ]}
      >
        <Text style={styles.boxText}>{digit}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.boxContainer} onPress={handlePress}>
        {boxArray.map(boxDigit)}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, '');
          if (cleaned.length <= maximumLength) {
            setCode(cleaned);
            if (cleaned.length === maximumLength) {
              Keyboard.dismiss();
            }
          }
        }}
        maxLength={maximumLength}
        keyboardType="number-pad"
        returnKeyType="done"
        textContentType="oneTimeCode"
        style={styles.hiddenTextInput}
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  boxContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    borderColor: Theme.colors.surfaceLight,
    borderWidth: 1.5,
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.sm,
    minWidth: 44,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
  },
  boxFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  boxFilled: {
    borderColor: Theme.colors.primaryLight,
  },
  boxDisabled: {
    opacity: 0.5,
    backgroundColor: Theme.colors.background,
  },
  boxText: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    textAlign: 'center',
    color: Theme.colors.text,
  },
  hiddenTextInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
