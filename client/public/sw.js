self.addEventListener('push', (event) => {
  let data = { title: 'Notification', body: '', routeLink: '/' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body || '',
      data: { routeLink: data.routeLink || '/' },
      icon: '/favicon.svg',
      badge: '/favicon.svg',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const routeLink = event.notification.data?.routeLink || '/';
  const origin = self.location.origin;
  const targetUrl = routeLink.startsWith('http')
    ? routeLink
    : `${origin}${routeLink.startsWith('/') ? '' : '/'}${routeLink}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(origin) && 'focus' in client) {
          if (typeof client.navigate === 'function') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
