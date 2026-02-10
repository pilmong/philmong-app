
function parseDate(dateStr) {
    // Expected format: 2026.01.30.(금) 오후 7:00, 1명
    // Regex to extract date and time parts
    // Parts: Year, Month, Day, (DayOfWeek), Ampm, Hour, Minute
    const regex = /(\d{4})\.(\d{1,2})\.(\d{1,2}).*?\s+(오전|오후)\s+(\d{1,2}):(\d{2})/;
    const match = dateStr.match(regex);

    if (match) {
        let year = parseInt(match[1]);
        let month = parseInt(match[2]) - 1; // JS months are 0-indexed
        let day = parseInt(match[3]);
        let ampm = match[4];
        let hour = parseInt(match[5]);
        let minute = parseInt(match[6]);

        if (ampm === "오후" && hour < 12) {
            hour += 12;
        } else if (ampm === "오전" && hour === 12) {
            hour = 0;
        }

        const date = new Date(year, month, day, hour, minute);
        return date.toISOString(); // or return Date object
    }
    return null;
}

// Test cases
const testDates = [
    "2026.01.30.(금) 오후 7:00, 1명",
    "2026.01.28.(수) 오후 6:00, 1명",
    "2026.11.05.(목) 오전 10:30, 4명"
];

testDates.forEach(d => {
    console.log(`Input: "${d}" => Output: ${parseDate(d)}`);
});
