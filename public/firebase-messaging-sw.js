importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js");

/*importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging.js');*/

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyBMl43PqiJBVu6Vj8cf6YyS3xEHwV0saZI",
    authDomain: "llxmsg.firebaseapp.com",
    projectId: "llxmsg",
    storageBucket: "llxmsg.firebasestorage.app",
    messagingSenderId: "420628832",
    appId: "1:420628832:web:7c7c4aecc2126761eeb605",
    measurementId: "G-D7NEK0NS69"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker
//   `messaging.onBackgroundMessage` handler.
messaging.onMessage((payload) => {
    console.log('onMessage', payload);
    var result = JSON.parse(payload);
    // ...
    // Customize notification here
    const notificationTitle = result.notification.title;
    const notificationOptions = {
        body: result.notification.body,
        icon: result.notification.image
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

messaging.onBackgroundMessage((payload) => {
    console.log('onBackgroundMessage.', payload);
    var result = JSON.parse(payload);

    // Customize notification here
    const notificationTitle = result.notification.title;
    const notificationOptions = {
        body: result.notification.body,
        icon: result.notification.image
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});