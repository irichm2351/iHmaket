import React, { useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MessagesScreen from '../../src/screens/messages/MessagesScreen';
import { withLoginRequired } from '../../src/components/withLoginRequired';

function MessagesTabWrapper() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const firstFocus = useRef(true);

  // Detect when user clicks the Messages tab
  useFocusEffect(
    React.useCallback(() => {
      // On first focus (initial navigation), don't clear params
      if (!firstFocus.current) {
        // User clicked the Messages tab after initial load
        // Clear any lingering params to show conversation list
        if (params.providerId || params.providerName || params.fromPreviousScreen) {
          router.setParams({
            providerId: undefined,
            providerName: undefined,
            providerProfilePic: undefined,
            fromPreviousScreen: undefined,
            scrollToBookingId: undefined,
          });
        }
      } else {
        // First focus - keep params for initial navigation from bookings
        firstFocus.current = false;
      }
    }, [params.providerId, params.providerName, params.fromPreviousScreen])
  );

  return <MessagesScreen />;
}

export default withLoginRequired(MessagesTabWrapper);
