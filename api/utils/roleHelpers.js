/**
 * Role & permission helper functions.
 * Single source of truth for all role checks — avoids case-sensitivity bugs.
 *
 * DB stores roles as UPPERCASE (USER, ADMIN).
 * All checks here normalise with toUpperCase() before comparing.
 */

const isAdmin = (user) => user?.role?.toUpperCase() === 'ADMIN';

const isHost = (user) => user?.isHost === true && !isAdmin(user);

const isRegularUser = (user) => user?.role?.toUpperCase() === 'USER';

const isBanned = (user) => user?.isBanned === true;

/**
 * Can the user manage (edit/delete) a place?
 * Returns true if user is the owner OR is admin.
 */
const canManagePlace = (user, place) => {
    if (!user || !place) return false;
    return place.ownerId === user.id || isAdmin(user);
};

/**
 * Can the user access this booking?
 * Returns true if user is the guest who booked OR the host of the place.
 */
const canAccessBooking = (user, booking, placeOwnerId) => {
    if (!user || !booking) return false;
    return booking.userId === user.id || placeOwnerId === user.id || isAdmin(user);
};

module.exports = { isAdmin, isHost, isRegularUser, isBanned, canManagePlace, canAccessBooking };
