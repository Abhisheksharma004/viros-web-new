"use client";

import React, { createContext, useContext } from "react";

export interface GrantedPermissionScope {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
}

/**
 * Default is ALL FALSE — most restrictive.
 * Admin dashboard pages that are rendered directly (not via employee granted route)
 * should use the <AdminPermissionBypass> wrapper to get full access.
 * Employee granted route sets the exact permissions from DB.
 */
const defaultPermissions: GrantedPermissionScope = {
    read: false,
    write: false,
    delete: false,
    admin: false,
};

const ModulePermissionContext = createContext<GrantedPermissionScope>(defaultPermissions);

/**
 * Provides specific permission scope to child components (used by employee granted route).
 */
export function ModulePermissionProvider({
    permission,
    children,
}: {
    permission: GrantedPermissionScope;
    children: React.ReactNode;
}) {
    return (
        <ModulePermissionContext.Provider value={permission}>
            {children}
        </ModulePermissionContext.Provider>
    );
}

/**
 * Admin Bypass: Wraps admin dashboard pages to grant full access.
 * Use this in every admin dashboard page layout so that
 * useModulePermission() returns full access when accessed directly by admin.
 */
export function AdminPermissionBypass({ children }: { children: React.ReactNode }) {
    const fullAccess: GrantedPermissionScope = {
        read: true,
        write: true,
        delete: true,
        admin: true,
    };
    return (
        <ModulePermissionContext.Provider value={fullAccess}>
            {children}
        </ModulePermissionContext.Provider>
    );
}

export function useModulePermission(): GrantedPermissionScope {
    return useContext(ModulePermissionContext);
}
