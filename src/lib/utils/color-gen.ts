export const generateColors = (dataMap: { label: string; data: number[] }[]) => {
    // tetradic color hues

    const colors = [
        '#00A3E0', //primary
        '#344054',
        '#e18b47', // orange
        '#edbf84',
        '#8671b9', // purple
        '#beb4d3',
        '#7f5b50', // brown
        '#b99f97',
        '#c987c1', //pink
        '#e6bdc9',
        '#669838', // green
        '#b3d78f',
        '#b74a3d', // red
        '#e4a19b',
        '#7f7f7f', // gray
        '#cccccc',
    ];

    const labeledColors = [] as { color: string; language: string }[];
    dataMap.sort((a, b) => {
        if (a.data.length > 0 && b.data.length > 0) {
            const sumA = a.data.reduce((total, current) => (total += current));
            const sumB = b.data.reduce((total, current) => (total += current));
            return sumB - sumA;
        }

        return 0;
    });

    for (let i = 0; i < dataMap.length; i++) {
        labeledColors.push({
            color: colors[i]!,
            language: dataMap[i]!.label,
        });
    }

    return labeledColors;
};
