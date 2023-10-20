export const convertToReadableSize = (size: number) => {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    if (isNaN(size)) {
        return 'Invalid input';
    }

    if (size < kb) {
        return `${size.toFixed(2)} B`;
    } else if (size < mb) {
        return `${(size / kb).toFixed(2)} KB`;
    } else if (size < gb) {
        return `${(size / mb).toFixed(2)} MB`;
    } else {
        return `${(size / gb).toFixed(2)} GB`;
    }
};
