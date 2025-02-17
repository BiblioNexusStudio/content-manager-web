import type { column } from '$lib/types/table';
import type { FlattenedNotificationContent, NotificationsContent } from './+page';
import { formatNotificationsDateString } from '$lib/utils/date-time';
import { patchToApi } from '$lib/utils/http-service';

export const notificationsContentsColumns: column<FlattenedNotificationContent>[] = [
    { text: 'Time', itemKey: 'time', sortKey: undefined },
    { text: 'User', itemKey: 'name', sortKey: undefined },
    { text: 'Notification', itemKey: 'notification', sortKey: undefined },
];

export const flattenNotificationContent = (
    notificationsContent: NotificationsContent[]
): FlattenedNotificationContent[] => {
    return notificationsContent.map((notification) => {
        return {
            id: notification.comment?.id,
            name: notification.comment?.user.name,
            time: formatNotificationsDateString(notification.comment?.created ?? ''),
            notification: notification.comment?.text,
            isRead: notification.isRead,
            resourceContentId: notification.comment?.resourceContentId,
            kind: notification.kind,
        };
    });
};

export const markNotificationAsReadAndGoToResourcePage = async (notification: FlattenedNotificationContent) => {
    if (!notification.isRead) {
        await patchToApi(`/notifications/${notification.kind}/${notification.id}`, { isRead: true });
    }

    window.location.href = `/resources/${notification.resourceContentId}`;
};

export const markAllSelectedNotificationsAsRead = async (notifications: FlattenedNotificationContent[]) => {
    await Promise.all(
        notifications.map(async (notification) => {
            if (!notification.isRead) {
                await patchToApi(`/notifications/${notification.kind}/${notification.id}`, { isRead: true });
            }
        })
    );
    window.location.reload();
};
