if (!__DEV__) {
    require('@bugsnag/expo').start();
}

import { LogBox } from "react-native";
LogBox.ignoreAllLogs();