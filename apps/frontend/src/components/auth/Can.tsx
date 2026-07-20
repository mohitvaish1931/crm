"use client";

import React, { ReactNode } from 'react';
import { usePermission } from '../../context/PermissionContext';

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({ permission, children, fallback = null }: CanProps) => {
  const { hasPermission, loading } = usePermission();

  if (loading) return null; // or a skeleton

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

interface PermissionBoundaryProps {
  permission: string;
  children: ReactNode;
}

export const PermissionBoundary = ({ permission, children }: PermissionBoundaryProps) => {
  const { hasPermission, loading } = usePermission();

  if (loading) return <div>Loading...</div>;

  if (!hasPermission(permission)) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-red-500">
        <h2 className="text-xl font-semibold">403 - Access Denied</h2>
        <p className="mt-2 text-sm text-gray-500">You lack the '{permission}' permission required to view this area.</p>
      </div>
    );
  }

  return <>{children}</>;
};
