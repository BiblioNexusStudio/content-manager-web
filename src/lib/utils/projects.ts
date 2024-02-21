import { fetchFromApiWithAuth } from '$lib/utils/http-service';

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) {
        return '';
    }

    if (typeof date === 'string') {
        const dateParts = date.split('-').map((part) => parseInt(part, 10));

        const year = dateParts[0] ?? 0;
        const month = dateParts[1] ?? 0;
        const day = dateParts[2] ?? 0;

        date = new Date(year, month - 1, day);
    }

    const options = { month: 'short' as const, day: '2-digit' as const, year: 'numeric' as const };
    const formattedDate = (date as Date).toLocaleDateString('en-US', options);

    return formattedDate;
}

export async function updateProject(id: number | string | undefined, data: { [key: string]: string | number }) {
    await fetchFromApiWithAuth(`/projects/${id}`, {
        method: 'PATCH',
        body: {
            ...data,
        },
    });
}

export async function startProject(id: number | string | undefined) {
    await fetchFromApiWithAuth(`/projects/${id}/start`, {
        method: 'POST',
        body: {},
    });
}

export function formatCurrency(amount: number | string): string {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return formatter.format(Number(amount));
}

export function formatNumberWithCommas(amount: number | string): string {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}