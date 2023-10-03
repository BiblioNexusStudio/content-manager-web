export const getLastFiveMonths = () => {
    const months: string[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 4; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        months.push(monthNames[monthIndex]);
    }

    return months;
};
