import { DrawerButton } from "@/app/components/DrawerButton";
import { Theme } from "@/app/theme";
import { Stack } from "expo-router";
import { Platform } from "react-native";

// Error boundary
export { ErrorBoundary } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                headerShadowVisible: false,
                headerTintColor: Theme.text,
                headerBackTitle: 'Back',
                headerStyle: {
                    backgroundColor: Theme.background,
                },
                headerBackVisible: true, // Broken in web
                headerLeft: (p) => <DrawerButton canGoBack={p.canGoBack} />
            }}
        >
            <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
            <Stack.Screen name="settings/account" options={{ title: 'Manage Account' }} />
            <Stack.Screen name="memory/[id]" options={{ title: 'Memory', presentation: Platform.OS === 'ios' ? 'modal' : 'card' }} />
            <Stack.Screen name="debug/index" options={{ title: 'Debug Tools' }} />
            <Stack.Screen name="debug/logs" options={{ title: 'Debug Logs' }} />
            <Stack.Screen name="debug/views" options={{ title: 'Views' }} />
            <Stack.Screen name="dev/index" options={{ title: 'Developer' }} />
            <Stack.Screen name="chat/main" options={{ title: 'Chat' }} />
        </Stack>
    )
}