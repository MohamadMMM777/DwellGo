import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [user, setUserRaw] = useState(null);
    const [ready, setReady] = useState(false);

    /**
     * Normalise and store user data.
     * Role is stored as received from server (UPPERCASE: USER, ADMIN).
     * Guards and Header use user.role?.toUpperCase() for comparisons.
     */
    function setUser(data) {
        if (data) {
            // Ensure role is UPPERCASE to match DB enum and middleware checks
            data = {
                ...data,
                role: data.role?.toUpperCase() || 'USER',
                isHost: data.isHost === true || data.isHost === 'true',
                isBanned: data.isBanned === true
            };
        }
        setUserRaw(data);
        setReady(true);
    }

    useEffect(() => {
        axios.get('/profile')
            .then(({ data }) => {
                if (data) {
                    setUser(data);
                } else {
                    setUserRaw(null);
                    setReady(true);
                }
            })
            .catch(() => {
                setUserRaw(null);
                setReady(true);
            });
    }, []);

    /**
     * Called after user activates host mode — updates local state without re-fetching.
     */
    function activateHostMode() {
        if (user) {
            setUserRaw(prev => ({ ...prev, isHost: true }));
        }
    }

    return (
        <UserContext.Provider value={{ user, setUser, ready, activateHostMode }}>
            {children}
        </UserContext.Provider>
    );
}
