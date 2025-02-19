export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function utcDateTimeStringToDateTime(date: string): Date {
    if (!date.endsWith('Z')) {
        date += 'Z';
    }

    return new Date(date);
}

export function formatUtcToLocalTimeAndDate(dateString: string): string {
    const dateTime = utcDateTimeStringToDateTime(dateString);

    const time = dateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${time} ${date}`;
}

export function formatSimpleDaysAgo(daysAgo: number | null) {
    return daysAgo === 0 ? '< 1' : (daysAgo ?? '');
}

// Output: "Jan 30, 2025, 2:44 PM"
export function formatNotificationsDateString(dateString: string): string {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

    return formattedDate;
}
