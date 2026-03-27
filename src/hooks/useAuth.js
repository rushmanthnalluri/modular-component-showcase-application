/**
 * useAuth — custom hook that subscribes to the auth user from localStorage/events.
 *
 * Base state : authUser (null | user object)  — single source of truth from storage.
 * Derived state: isLoggedIn, canAddComponent — computed from authUser, never stored separately.
 *
 * Usage:
 *   const { authUser, isLoggedIn, canAddComponent, isLoading } = useAuth();
 */
import { useEffect, useState } from "react";
import { subscribeToAuthUser, canAccessAddComponent } from "@/services/authAccess";

export function useAuth() {
    // Base state: null means "not yet resolved". After first emit it is null (unauthenticated) or an
    // object (authenticated).
    const [authUser, setAuthUser] = useState(undefined);

    useEffect(() => {
        // subscribeToAuthUser immediately calls onChange with the current stored user.
        const unsubscribe = subscribeToAuthUser((user) => {
            setAuthUser(user ?? null);
        });
        return unsubscribe;
    }, []);

    // Derived / computed values — never stored in state.
    const isLoading = authUser === undefined;
    const isLoggedIn = Boolean(authUser);
    const canAdd = canAccessAddComponent(authUser);

    return {
        /** The raw auth user object (null when not logged in, undefined while resolving). */
        authUser,
        /** True while the initial auth check has not yet completed. */
        isLoading,
        /** True when a user is logged in. */
        isLoggedIn,
        /** True when the logged-in user has permission to add components. */
        canAddComponent: canAdd,
    };
}
