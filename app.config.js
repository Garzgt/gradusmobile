module.exports = {
  expo: {
    name: "Gradus",
    slug: "gradus",
    version: "1.0.0",
    scheme: "gradus",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.psu.gradus",
    },
    android: {
      package: "com.psu.gradus",
      // EAS Build injects the gitignored file's path via this env var (see the
      // GOOGLE_SERVICES_JSON file environment variable). Falls back to the local
      // file for local/native builds where the real file already sits in the repo root.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
        backgroundColor: "#1a3c5e",
      },
      permissions: ["android.permission.RECORD_AUDIO"],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-dev-client",
      "expo-asset",
      "expo-secure-store",
      "expo-web-browser",
      "expo-font",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#1a3c5e",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "GRADUS needs access to your photos for profile picture upload.",
          cameraPermission: "GRADUS needs access to your camera for profile picture upload.",
        },
      ],
      "expo-sharing",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#1a3c5e",
        },
      ],
      "expo-status-bar",
    ],
    extra: {
      eas: {
        projectId: "1a4fd8da-d666-43a4-89df-5be92931d985",
      },
    },
    owner: "garzgt",
  },
};
