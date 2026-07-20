"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';

// In a real app, this would be fetched from /iam/discovery
// and managed by TanStack Query
interface PermissionContextType {
  permissions: string[];
  features: string[];
  hash: string | null;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [hash, setHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking fetch from BFF /iam/discovery
    setTimeout(() => {
      setPermissions(['inventory.read', 'inventory.create', 'sales.read']);
      setFeatures(['FEATURE_AI_INSIGHTS']);
      setHash('mock-hash-12345');
      setLoading(false);
    }, 500);
  }, []);

  return (
    <PermissionContext.Provider value={{ permissions, features, hash, loading }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  
  const hasPermission = (requiredPermission: string) => {
    if (context.permissions.includes('*.all')) return true;
    
    // Support wildcard matching e.g. inventory.*
    const [resource] = requiredPermission.split('.');
    return context.permissions.includes(requiredPermission) || context.permissions.includes(`${resource}.*`);
  };

  const hasFeature = (feature: string) => {
    return context.features.includes(feature);
  };

  return { ...context, hasPermission, hasFeature };
};
