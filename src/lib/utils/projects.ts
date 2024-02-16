import { fetchFromApiWithAuth } from '$lib/utils/http-service';

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) {
        return '';
    }

    if (typeof date === 'string') {
        date = new Date(date);
    }

    const options = { month: 'short' as const, day: '2-digit' as const, year: 'numeric' as const };
    const formattedDate = date.toLocaleDateString('en-US', options);

    return formattedDate;
}

export async function updateProject(id: number | string, data: { [key: string]: string }) {
    await fetchFromApiWithAuth(`/projects/${id}`, {
        method: 'PUT',
        body: {
            ...data,
        },
    });
}
