import * as React from 'react';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { storage } from '@/storage';
import { BackendClient } from '@/modules/api/client';
import { AppService } from '@/modules/services/AppService';
import { cleanAndReload } from '@/modules/reload/cleanAndReload';
import { backoff } from '@/utils/time';
import { SERVER_ENDPOINT } from '@/config';
import { Platform } from 'react-native';

const ONBOARDING_VERSION = 4; // Increment this to reset onboarding

//
// State
//

export type OnboardingState = {
    kind: 'prepare'
} | {
    kind: 'need_username'
} | {
    kind: 'need_name'
} | {
    kind: 'need_push'
} | {
    kind: 'need_activation'
};

export type GlobalState = {
    kind: 'empty'
} | {
    kind: 'onboarding',
    state: OnboardingState,
    token: string,
    client: BackendClient
} | {
    kind: 'ready',
    token: string,
    client: BackendClient
};

let globalAppModel: AppService | null = null;

export const GlobalStateContext = React.createContext<GlobalState>({ kind: 'empty' });

export function useGlobalState() {
    return React.useContext(GlobalStateContext);
}

export function useClient() {
    let state = useGlobalState();
    if (state.kind === 'empty') {
        throw new Error('GlobalState is empty');
    }
    return state.client;
}

export function useAppModel() {
    let state = useGlobalState();
    if (state.kind !== 'ready') {
        throw new Error('GlobalState is not ready');
    }
    return globalAppModel!!;
};

export function hasAppModel() {
    return !!globalAppModel;
}

export function getAppModel() {
    if (!globalAppModel) {
        throw new Error('GlobalState is not ready');
    }
    return globalAppModel;
}

export function loadAppModelIfNeeded() {
    if (globalAppModel) {
        return;
    }

    let token = getToken();
    if (!token) {
        return;
    }
    if (!isOnboardingCompleted()) {
        return;
    }

    // Create client
    let client = new BackendClient(axios.create({
        baseURL: `https://${SERVER_ENDPOINT}`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }), token);
    globalAppModel = new AppService(client);
}

//
// Controller
//

export type GlobalStateController = {
    login(token: string): void,
    logout(): void,
    refresh(): Promise<GlobalState>,
};

export const GlobalStateControllerContext = React.createContext<GlobalStateController | null>(null);

export function useGlobalStateController() {
    const controller = React.useContext(GlobalStateControllerContext);
    if (!controller) {
        throw new Error('GlobalStateControllerContext not found');
    }
    return controller;
}

//
// Storage
//

export function storeToken(token: string) {
    storage.set('token', token);
}

export function clearToken() {
    storage.delete('token');
}

export function getToken() {
    return storage.getString('token');
}

export function onboardingMarkCompleted() {
    storage.set('onboarding:completed', ONBOARDING_VERSION);
}

export function isOnboardingCompleted() {
    return storage.getNumber('onboarding:completed') === ONBOARDING_VERSION;
}

export function resetOnboardingState() {
    storage.delete('onboarding:completed');
    storage.delete('onboarding:skip_notifications');
    storage.delete('onboarding:skip_voice');
    storage.delete('onboarding:skip_pairing');
}

export function markSkipNotifications() {
    storage.set('onboarding:skip_notifications', true);
}

export function isSkipNotifications() {
    return storage.getBoolean('onboarding:skip_notifications');
}

export function isSkipVoice() {
    return storage.getBoolean('onboarding:skip_voice');
}

export function isSkipPairing() {
    return storage.getBoolean('onboarding:skip_pairing');
}

export function markSkipVoice() {
    storage.set('onboarding:skip_voice', true);
}

export function markSkipPairing() {
    storage.set('onboarding:skip_pairing', true);
}

//
// Implementation
//

async function checkIfTokenValid(client: BackendClient) {
    let status = await client.tokenAndAccountStatus();
    // console.warn(status);
    if (!await client.tokenAndAccountStatus()) {
        await cleanAndReload(); // Never resolves
    }
}

async function refreshOnboarding(client: BackendClient): Promise<OnboardingState | null> {

    // Load server state
    let serverState = await client.fetchPreState();
    console.warn(serverState);
    if (serverState.needUsername) {
        return { kind: 'need_username' };
    }
    if (serverState.needName) {
        return { kind: 'need_name' };
    }

    // Request notifications
    let notificationPermissions = await Notifications.getPermissionsAsync();
    if (notificationPermissions.status === 'undetermined' && !isSkipNotifications() && notificationPermissions.canAskAgain) {
        return { kind: 'need_push' };
    }

    // In the end require activation
    if (serverState.canActivate) {
        return { kind: 'need_activation' };
    }

    // All requirements satisfied
    return null;
}

export function useNewGlobalController(): [GlobalState, GlobalStateController] {

    // Global state handler
    const [state, setState] = React.useState<GlobalState>(() => {

        // Check if already created
        if (globalAppModel) {
            return {
                kind: 'ready',
                token: globalAppModel.client.token,
                client: globalAppModel.client
            };
        }

        // Check if we have a token
        let token = getToken();
        if (!token) {
            return { kind: 'empty' };
        }

        // Create client with tokenq
        let client = new BackendClient(axios.create({
            baseURL: `https://${SERVER_ENDPOINT}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }), token);

        // If onboarding is completed - we are ready
        if (isOnboardingCompleted()) {
            globalAppModel = new AppService(client);
            return {
                kind: 'ready',
                token: token,
                client
            };
        }

        // If onboarding is not completed - we need to load fresh state from the server
        return {
            kind: 'onboarding',
            token: token,
            state: { kind: 'prepare' },
            client
        };
    });

    // Controller
    const controller = React.useMemo<GlobalStateController>(() => {
        let currentState = state;
        return {
            login(token) {

                // Reset persistence
                storeToken(token);
                resetOnboardingState();

                // Create client
                let client = new BackendClient(axios.create({
                    baseURL: `https://${SERVER_ENDPOINT}`,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }), token);

                // Update state
                currentState = {
                    kind: 'onboarding',
                    token: token,
                    state: { kind: 'prepare' },
                    client
                };
                setState(currentState);
            },
            logout() {

                // Reset persistence
                clearToken();
                resetOnboardingState();

                // Update state
                currentState = {
                    kind: 'empty'
                };
                setState(currentState);
            },
            refresh: async () => {

                if (currentState.kind === 'empty') { // Why?
                    return currentState;
                }
                const client = currentState.client;
                const onboardingState = await backoff(async () => {

                    // Check if token is valid
                    await checkIfTokenValid(client);

                    // Fetch onboarding state
                    return await refreshOnboarding(client);
                });

                // Requirements satisfied
                if (!onboardingState) {
                    onboardingMarkCompleted();
                    globalAppModel = new AppService(client);
                    currentState = {
                        kind: 'ready',
                        token: currentState.token,
                        client: currentState.client,
                    };
                    setState(currentState);
                    return currentState;
                }

                // Update state with new onboarding state
                currentState = {
                    kind: 'onboarding',
                    token: currentState.token,
                    state: onboardingState,
                    client: currentState.client
                };
                setState(currentState);

                return currentState;
            },
        } satisfies GlobalStateController;
    }, []);

    return [state, controller];
}