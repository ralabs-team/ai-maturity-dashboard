import * as amplitude from '@amplitude/unified';
import { createInstance } from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = '384d68052f362fe706f4bb9eb84d22d7';
const ANONYMIZED_DATA_CONSENT_STORAGE_KEY = 'ai-maturity-dashboard.anonymized-data-consent.v1';
const analyticsEnvironment = import.meta.env.MODE;
const analyticsAppVersion = __APP_VERSION__;
let hasInitialized = false;
let analyticsWorkspaceName = '';
let feedbackClient: ReturnType<typeof createInstance> | null = null;
let hasInitializedFeedbackClient = false;

function readStoredAnalyticsConsent() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    const stored = window.localStorage.getItem(ANONYMIZED_DATA_CONSENT_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

let hasAnalyticsConsent = readStoredAnalyticsConsent();

function cleanEventProperties(eventProperties?: Record<string, unknown>) {
  if (!eventProperties) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(eventProperties).filter(([, value]) => value !== undefined),
  );
}

function applyAnalyticsIdentity() {
  if (!hasInitialized) {
    return;
  }

  const identify = new amplitude.Identify()
    .set('Environment', analyticsEnvironment)
    .set('App Version', analyticsAppVersion);

  if (analyticsWorkspaceName) {
    identify.set('team_name', analyticsWorkspaceName);
  }

  amplitude.identify(identify);

  if (analyticsWorkspaceName) {
    amplitude.setGroup('team_name', analyticsWorkspaceName);
  }
}

function initializeFeedbackClient() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!feedbackClient) {
    feedbackClient = createInstance();
  }

  if (hasInitializedFeedbackClient) {
    return feedbackClient;
  }

  feedbackClient.init(AMPLITUDE_API_KEY, {
    appVersion: analyticsAppVersion,
    autocapture: false,
    defaultTracking: false,
    fetchRemoteConfig: false,
    remoteConfig: {
      fetchRemoteConfig: false,
    },
    identityStorage: 'none',
    enableDiagnostics: false,
    trackingOptions: {
      ipAddress: false,
      language: false,
      platform: false,
    },
  });

  hasInitializedFeedbackClient = true;

  return feedbackClient;
}

export function initializeAmplitude() {
  if (typeof window === 'undefined' || hasInitialized || !hasAnalyticsConsent) {
    return;
  }

  amplitude.initAll(AMPLITUDE_API_KEY, {
    analytics: {
      appVersion: analyticsAppVersion,
      remoteConfig: {
        fetchRemoteConfig: true,
      },
      autocapture: {
        attribution: true,
        fileDownloads: true,
        formInteractions: true,
        pageViews: true,
        sessions: true,
        elementInteractions: true,
        networkTracking: true,
        webVitals: true,
        frustrationInteractions: {
          errorClicks: true,
          deadClicks: true,
          rageClicks: true,
        },
      },
    },
    sessionReplay: {
      sampleRate: 1,
    },
  });

  hasInitialized = true;
  applyAnalyticsIdentity();
}

export function setAnalyticsConsent(nextValue: boolean) {
  hasAnalyticsConsent = nextValue;

  if (typeof window === 'undefined') {
    return;
  }

  if (!nextValue) {
    if (hasInitialized) {
      amplitude.setOptOut(true);
    }

    return;
  }

  initializeAmplitude();

  if (hasInitialized) {
    amplitude.setOptOut(false);
    applyAnalyticsIdentity();
  }
}

export function setAnalyticsWorkspaceName(nextValue: string) {
  analyticsWorkspaceName = nextValue.trim();

  if (typeof window === 'undefined' || !hasAnalyticsConsent) {
    return;
  }

  initializeAmplitude();
  applyAnalyticsIdentity();
}

export function trackEvent(eventType: string, eventProperties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent) {
    return;
  }

  initializeAmplitude();

  if (!hasInitialized) {
    return;
  }

  amplitude.track(eventType, cleanEventProperties({
    team_name: analyticsWorkspaceName || undefined,
    ...eventProperties,
  }));
}

export function trackChartFeedbackEvent(eventType: string, eventProperties?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }

  if (hasAnalyticsConsent) {
    trackEvent(eventType, eventProperties);
    return;
  }

  const client = initializeFeedbackClient();

  if (!client) {
    return;
  }

  client.track(eventType, cleanEventProperties({
    team_name: analyticsWorkspaceName || undefined,
    environment: analyticsEnvironment,
    app_version: analyticsAppVersion,
    ...eventProperties,
  }));
}
