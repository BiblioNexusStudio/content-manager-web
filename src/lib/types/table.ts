export interface column<T> {
    text: string;
    itemKey?: keyof T;
    sortKey: string | undefined;
}
