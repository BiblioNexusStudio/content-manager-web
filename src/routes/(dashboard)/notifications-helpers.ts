import type { column } from '$lib/types/table';
import type { FlattenedNotificationsContent, NotificationsContent } from './+page';
import { formatNotificationsDateString } from '$lib/utils/date-time';
import { patchToApi, postToApi } from '$lib/utils/http-service';
import { _NotificationKind as NotificationKind } from './+page';

export const notificationsContentColumns: column<FlattenedNotificationsContent>[] = [
    { text: 'Time', itemKey: 'time', sortKey: undefined },
    { text: 'User', itemKey: 'name', sortKey: undefined },
    { text: 'Notification', itemKey: 'notification', sortKey: undefined },
];

export const flattenNotificationsContent = (
    notificationsContent: NotificationsContent[]
): FlattenedNotificationsContent[] => {
    return notificationsContent
        .filter((notification) => notification.kind === NotificationKind.comment)
        .map((notification) => {
            return {
                id: notification.comment?.id,
                name: notification.comment?.user.name,
                time: formatNotificationsDateString(notification.comment?.created ?? ''),
                notification: notification.comment?.text,
                notoficationId: notification.comment?.id,
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

    window.location.href = `/resources/${notification.resourceContentId}?commentId=${notification.notoficationId}`;
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

    bulkNotificationUpdatePayload.forEach((notification) => {
        const notificationIndex = notifications.findIndex(
            (n) => n.kind === notification.notificationKind && n.id === notification.notificationKindId
        );

        if (notificationIndex !== -1) {
            notifications[notificationIndex]!.isRead = true;
        }
    });
};
