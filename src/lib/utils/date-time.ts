export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function formatUtcToLocalTimeAndDate(dateString: string): string {
    if (!dateString.endsWith('Z')) {
        dateString += 'Z';
    }

    const dateTime = new Date(dateString);

    const time = dateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${time} ${date}`;
}
