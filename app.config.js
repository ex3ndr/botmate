//
// Parameters
//

const IS_NEXT = process.env.APP_ENV !== 'production';
const RUNTIME_VERSION = "1";

//
// Config
//

export default {
  "expo": {
    "name": "Botmate",
    "slug": "botmate",
    "version": "1.2.0",
    "runtimeVersion": RUNTIME_VERSION,
    "orientation": "portrait",
    "icon": IS_NEXT ? './assets/icon_next.png' : "./assets/icon.png",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "scheme": "botmate",
    "splash": {
      "backgroundColor": "#000"
    },
    "androidStatusBar": {
      "barStyle": "light-content",
      "backgroundColor": "#121212",
      "translucent": false
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "backgroundColor": "#121212",
      "supportsTablet": true,
      "bundleIdentifier": "org.botmate.ios",
      "associatedDomains": ["applinks:botmate.org"],
      "infoPlist": {
        "UIBackgroundModes": [
          "fetch",
          "remote-notification",
          "bluetooth-central"
        ],
        "UIViewControllerBasedStatusBarAppearance": true,
        "NSMicrophoneUsageDescription": "Bubble uses the microphone to record audio to be analyzed by AI."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "backgroundColor": "#121212",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000"
      },
      "package": "com.bubbleapp.android",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "botmate.org",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-localization",
      "onnxruntime-react-native",
      "react-native-vision-camera",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 31
          }
        }
      ],
      ["expo-router", {
        "root": "./sources/app/routes",
      }]
    ],
    "extra": {
      "eas": {
        "projectId": "7d925825-bdf8-4ee0-bff3-f2d873dbff37"
      },
      "bugsnag": {
        "apiKey": "d6752ef54836994437180027a581b761"
      }
    },
    "owner": "bulkacorp",
    "updates": {
      "url": "https://u.expo.dev/7d925825-bdf8-4ee0-bff3-f2d873dbff37"
    },
    "experiments": {
      "typedRoutes": true
    }
  }
}
