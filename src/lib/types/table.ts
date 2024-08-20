export interface column<T> {
    text: string;
    width?: number;
    itemKey?: keyof T;
    sortKey: string | undefined;
}
