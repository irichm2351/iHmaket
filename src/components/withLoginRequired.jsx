import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LoginModal from './LoginModal';
import HomeScreen from '../screens/home/HomeScreen';
import { useAuthStore } from '../store/authStore';

export const withLoginRequired = (ScreenComponent) => {
  return function WithLoginRequired(props) {
    const { user } = useAuthStore();
    const [showLoginModal, setShowLoginModal] = useState(!user);

    useFocusEffect(
      React.useCallback(() => {
        if (!user) {
          setShowLoginModal(true);
        } else {
          setShowLoginModal(false);
        }
      }, [user])
    );

    React.useEffect(() => {
      if (!user) {
        setShowLoginModal(true);
      } else {
        setShowLoginModal(false);
      }
    }, [user]);

    const handleCloseModal = () => {
      setShowLoginModal(false);
    };

    // Show home screen with login modal overlay if not logged in
    if (!user) {
      return (
        <View style={styles.container}>
          <HomeScreen />
          <LoginModal
            visible={showLoginModal}
            onClose={handleCloseModal}
          />
        </View>
      );
    }

    return <ScreenComponent {...props} />;
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});
