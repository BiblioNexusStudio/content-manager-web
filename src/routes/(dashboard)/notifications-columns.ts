import type { column } from '$lib/types/table';
import type { FlattenedNotificationContent } from './+page';

export const notificationsContentsColumns: column<FlattenedNotificationContent>[] = [
    { text: 'Time', itemKey: 'time', sortKey: undefined },
    { text: 'User', itemKey: 'name', sortKey: undefined },
    { text: 'Notification', itemKey: 'notification', sortKey: undefined },
];
