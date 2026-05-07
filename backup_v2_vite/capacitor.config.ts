import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ninoc.enterprise',
  appName: 'NINOC Fashion',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
