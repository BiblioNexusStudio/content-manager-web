export const generateColors = (colorAmount: number) => {
    // tetradic color hues
    const colorHues = [197, 287, 17, 107];
    const min = 32;
    const maxLight = 82;
    let lightness = min;
    let hueidx = 0;
    let hue = colorHues[hueidx];
    const colorJump = Math.floor((maxLight - min) / (colorAmount / colorHues.length));
    const colors: string[] = [];

    for (let i = 0; i < colorAmount; i++) {
        colors[i] = `hsl(${hue}, 70%, ${lightness}%)`;
        hue = colorHues[++hueidx];
        if (hueidx % colorHues.length == 0) {
            hueidx = 0;
            hue = colorHues[hueidx];
            if (lightness < maxLight - colorJump) {
                lightness += colorJump;
            } else {
                lightness = min;
            }
        }
    }
    return colors;
};
