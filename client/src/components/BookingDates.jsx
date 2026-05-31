import { differenceInCalendarDays, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Moon, Calendar } from 'lucide-react';

export default function BookingDates({ booking, className }) {
    const nights = differenceInCalendarDays(new Date(booking.checkOut), new Date(booking.checkIn));
    return (
        <div className={"flex flex-wrap gap-2 items-center text-sm " + (className || '')}>
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--primary-600)' }}>
                <Moon size={13} />
                {nights} gece
            </span>
            <span style={{ color: 'var(--on-surface-2)' }}>·</span>
            <div className="flex gap-1 items-center" style={{ color: 'var(--on-surface-2)' }}>
                <Calendar size={13} style={{ color: 'var(--primary-500)' }} />
                {format(new Date(booking.checkIn), 'd MMM yyyy', { locale: tr })}
            </div>
            <span style={{ color: 'var(--on-surface-2)' }}>→</span>
            <div className="flex gap-1 items-center" style={{ color: 'var(--on-surface-2)' }}>
                <Calendar size={13} style={{ color: 'var(--primary-500)' }} />
                {format(new Date(booking.checkOut), 'd MMM yyyy', { locale: tr })}
            </div>
        </div>
    );
}
