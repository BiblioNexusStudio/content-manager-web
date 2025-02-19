import type { column } from '$lib/types/table';
import type { FlattenedNotificationsContent, NotificationsContent } from './+page';
import { formatNotificationsDateString } from '$lib/utils/date-time';
import { patchToApi, postToApi } from '$lib/utils/http-service';

export const notificationsContentColumns: column<FlattenedNotificationsContent>[] = [
    { text: 'Time', itemKey: 'time', sortKey: undefined },
    { text: 'User', itemKey: 'name', sortKey: undefined },
    { text: 'Notification', itemKey: 'notification', sortKey: undefined },
];

export const flattenNotificationsContent = (
    notificationsContent: NotificationsContent[]
): FlattenedNotificationsContent[] => {
    return notificationsContent.map((notification) => {
        return {
            id: notification.comment?.id,
            name: notification.comment?.user.name,
            time: formatNotificationsDateString(notification.comment?.created ?? ''),
            notification: notification.comment?.text,
            isRead: notification.isRead,
            resourceContentId: notification.comment?.resourceContentId,
            parentResourceDisplayName: notification.comment?.parentResourceDisplayName,
            title: notification.comment?.resourceEnglishLabel,
            kind: notification.kind,
        };
    });
};

export const markNotificationAsReadAndGoToResourcePage = async (notification: FlattenedNotificationsContent) => {
    if (!notification.isRead) {
        await patchToApi(`/notifications/${notification.kind}/${notification.id}`, { isRead: true });
    }

    window.location.href = `/resources/${notification.resourceContentId}`;
};

export const markAllSelectedNotificationsAsRead = async (notifications: FlattenedNotificationsContent[]) => {
    const bulkNotificationUpdatePayload = notifications.map((notification) => {
        return {
            notificationKind: notification.kind,
            notificationKindId: notification.id,
            isRead: true,
        };
    });

    await postToApi('/notifications/update', { updates: bulkNotificationUpdatePayload });

    window.location.reload();
};
