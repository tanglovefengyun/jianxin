// Hash function for generating fingerprint
function generateHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash); // Return absolute value
}

// Generate comprehensive browser fingerprint
function getFingerprint() {
    const components = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages ? navigator.languages.join(',') : 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        screen: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        sessionStorage: !!window.sessionStorage,
        localStorage: !!window.localStorage,
        indexedDB: !!window.indexedDB,
        touchSupport: 'ontouchstart' in window,
        doNotTrack: navigator.doNotTrack || 'unknown',
        cookieEnabled: navigator.cookieEnabled,
        pdfViewerEnabled: navigator.pdfViewerEnabled || 'unknown'
    };
    
    const fingerprintString = JSON.stringify(components);
    return generateHash(fingerprintString);
}

const visitorId = getFingerprint();
console.log(visitorId)

window.MTpushInterfaceExtension.initSdk({
  appkey: '',
  user_str: String(visitorId),
});

chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'MTPUSH_INIT_SDK_SUCCESS':
      console.log('Initialization successful: ', message.data);
      break;

    case 'MTPUSH_INIT_SDK_FAIL':
      console.log('Initialization failed: ', message.data);
      break;

    case 'MTPUSH_ON_MSG_RECEIVE':
      console.log('Receive a push message: ', message.data);
      break;
  }
});
