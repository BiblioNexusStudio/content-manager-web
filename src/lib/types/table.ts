export interface column {
    text: string;
    itemKey: string;
    sortKey: string | undefined;
    currentSort: string | undefined;
}

export interface genericObject {
    [key: string]: string | number | boolean | undefined | null;
}

export interface selectableItem extends genericObject {
    isSelected: boolean;
}
