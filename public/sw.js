// Service Worker for Oceanstar Push Notifications
const CACHE_NAME = 'oceanstar-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let data = {
        title: '🔔 새로운 예약',
        body: '새로운 예약이 들어왔습니다!',
        icon: '/oceanstar_logo.jpg',
        badge: '/oceanstar_logo.jpg',
        tag: 'reservation-notification',
        data: { url: '/dashboard/alerts' }
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data = { ...data, ...payload };
        }
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
    }

    const options = {
        body: data.body,
        icon: data.icon || '/oceanstar_logo.jpg',
        badge: data.badge || '/oceanstar_logo.jpg',
        tag: data.tag || 'reservation-notification',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        actions: [
            { action: 'view', title: '확인하기' },
            { action: 'dismiss', title: '닫기' }
        ],
        data: data.data || { url: '/dashboard/alerts' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/dashboard/alerts';

    if (event.action === 'dismiss') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes('/dashboard') && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
