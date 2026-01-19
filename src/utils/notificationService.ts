import storage from './storage';

interface NotificationTask {
  id: string;
  time: string;
  intervalId?: NodeJS.Timeout;
}

let activeTask: NotificationTask | null = null;

export const notificationService = {
  // Request notification permission
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Send a notification
  sendNotification: (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/logo.png',
        ...options,
      });
    }
  },

  // Start daily mood reminder
  startDailyReminder: (time: string) => {
    // Stop existing reminder
    notificationService.stopDailyReminder();

    // Request permission first
    notificationService.requestPermission().then((granted) => {
      if (!granted) return;

      const [hours, minutes] = time.split(':').map(Number);

      const checkAndNotify = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        if (currentHours === hours && currentMinutes === minutes) {
          const profile = storage.getUserProfile();
          notificationService.sendNotification('Time to track your mood!', {
            body: `Hi ${profile.name || 'friend'}, how are you feeling today? Let's check in with your mood.`,
            tag: 'daily-reminder',
            requireInteraction: true,
          });
        }
      };

      // Check every minute
      const intervalId = setInterval(checkAndNotify, 60000);

      activeTask = {
        id: `reminder-${time}`,
        time,
        intervalId,
      };

      // Check immediately in case we're at the right time
      checkAndNotify();
    });
  },

  // Stop daily reminder
  stopDailyReminder: () => {
    if (activeTask?.intervalId) {
      clearInterval(activeTask.intervalId);
      activeTask = null;
    }
  },

  // Initialize reminders based on settings
  initializeReminders: () => {
    const profile = storage.getUserProfile();
    if (profile.settings.notifications && profile.settings.notificationTime) {
      notificationService.startDailyReminder(profile.settings.notificationTime);
    }
  },

  // Send crisis notification
  sendCrisisNotification: () => {
    notificationService.sendNotification('Crisis Support Available', {
      body: 'Please reach out to a crisis support helpline if you need help.',
      requireInteraction: true,
      badge: '/crisis-badge.png',
    });
  },

  // Send motivational notification
  sendMotivationalNotification: () => {
    const motivationalMessages = [
      "You're doing great! Keep taking care of yourself.",
      'Remember: Your mental health matters. You matter.',
      'Every moment is a fresh beginning. Keep going!',
      'You are stronger than you think.',
      'Progress, not perfection. Keep going!',
    ];

    const randomMessage =
      motivationalMessages[
        Math.floor(Math.random() * motivationalMessages.length)
      ];

    notificationService.sendNotification('Keep Going!', {
      body: randomMessage,
      tag: 'motivational',
    });
  },
};

export default notificationService;
