import type { ConfigContext, ExpoConfig } from 'expo/config';

type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];

function withGoogleMapsApiKey(
  plugins: ExpoPlugin[],
  googleMapsApiKey: string,
): ExpoPlugin[] {
  return plugins.map((plugin): ExpoPlugin => {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;

    if (pluginName !== 'react-native-maps') {
      return plugin;
    }

    return [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
      },
    ];
  });
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleMapsApiKey === undefined || googleMapsApiKey.length === 0) {
    throw new Error('Missing GOOGLE_MAPS_API_KEY environment variable');
  }

  const name = config.name;
  const slug = config.slug;

  if (name === undefined || slug === undefined) {
    throw new Error('Missing required expo.name or expo.slug in app.json');
  }

  return {
    ...config,
    name,
    slug,
    plugins: withGoogleMapsApiKey(config.plugins ?? [], googleMapsApiKey),
  };
};
