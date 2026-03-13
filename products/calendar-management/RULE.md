# Calendar Scheduling Product

## Entry Points

### Backend
- `app/modules/scheduling/routers/calendar_slots.py`
- `app/modules/scheduling/routers/timetable_blocks.py`
- `app/modules/scheduling/routers/availability.py`

### Frontend
- `CompanyCalendarView` - Recruiter calendar
- `StudentCalendarView` - Candidate calendar

## Core Dependencies
- `shared.models.calendar`, `shared.models.core`
- `api/calendar.js`, `api/core.js`

## DB Tables
- `calendar_slots`, `timetable_blocks`, `slot_bookings`, `student_slot_availability`
