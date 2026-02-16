import React from 'react';
import MessagesScreen from '../src/screens/messages/MessagesScreen';
import { withLoginRequired } from '../src/components/withLoginRequired';

function BookingMessageScreen() {
  return <MessagesScreen />;
}

export default withLoginRequired(BookingMessageScreen);
