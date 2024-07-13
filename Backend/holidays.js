// holidays.js
const nonFloatingHolidays = [
    { name: "New Year's Day", date: "2024-01-01", day: "Monday" },
    { name: "Guru Govind Singh Jayanti", date: "2024-01-05", day: "Friday" },
    { name: "Day of the Republic", date: "2024-01-26", day: "Friday" },
    { name: "Me-dam-me-phi (Ancestor Festival of Ahom)", date: "2024-01-31", day: "Wednesday" },
    { name: "Bengali New Year (Tripura + West Bengal only)", date: "2024-04-14", day: "Sunday" },
    { name: "Labor Day", date: "2024-05-01", day: "Wednesday" },
    { name: "Birthday of Rabindra Nath Tagore", date: "2024-05-07", day: "Tuesday" },
    { name: "Independence Day", date: "2024-08-15", day: "Thursday" },
    { name: "Birthday of Mahatma Gandhi", date: "2024-10-02", day: "Wednesday" },
    { name: "Birthday of the Islamic Prophet Muhammad", date: "2024-12-24", day: "Tuesday" },
    { name: "Christian Christmas", date: "2024-12-25", day: "Wednesday" },
    { name: "New Year's Eve", date: "2024-12-31", day: "Tuesday" },
    // Add similar entries for the years 2025 to 2030
  ];
  
  const floatingHolidays = [
    { name: "Good Friday", date: "2024-03-29", day: "Friday" },
    { name: "Festival of breaking the fast", date: "2024-04-09", day: "Tuesday" },
    { name: "Mother's Day", date: "2024-05-12", day: "Sunday" },
    { name: "Father's Day", date: "2024-06-16", day: "Sunday" },
    { name: "Festival of Sacrifice", date: "2024-06-16", day: "Sunday" },
    { name: "Awal Muharram (Islamic New Year)", date: "2024-07-07", day: "Sunday" },
    { name: "Diwali (Hindu festival of lights)", date: "2024-11-01", day: "Friday" },
    // Add similar entries for the years 2025 to 2030
  ];
  
  const holidays = [
    ...nonFloatingHolidays,
    ...floatingHolidays
  ];
  
  module.exports = holidays;
  