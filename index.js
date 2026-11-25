// $env:NGROK_AUTHTOKEN="7L2nXOzeXfYGA3YMo2Xp6nCj2XfysMZ0sYqgNqxU"; npx expo start --tunnel
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
