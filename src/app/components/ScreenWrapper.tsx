import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
};

const ScreenWrapper = ({ children }: Props) => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
};

export default ScreenWrapper;