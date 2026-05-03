"use client";

import * as FiIcons from "react-icons/fi";
import { ClientOnly } from "./client-only";

// A component that dynamically loads Fi icons with client-side only rendering
export function DynamicIcon({ name, className, ...props }) {
  // Map some specific names if needed
  const nameMap = {
    'CheckCircle2': 'FiCheckCircle',
    'Share2': 'FiShare2',
    'ChevronsLeft': 'FiChevronsLeft',
    'ChevronsRight': 'FiChevronsRight'
  };

  const iconName = nameMap[name] || `Fi${name}`;
  
  // Get the icon component from feather icons
  const IconComponent = FiIcons[iconName] || FiIcons.FiHelpCircle;

  // Return the icon wrapped in ClientOnly to prevent hydration errors
  return (
    <ClientOnly fallback={<div className={className} />}>
      {IconComponent ? (
        <IconComponent className={className} {...props} />
      ) : (
        <div className={className} />
      )}
    </ClientOnly>
  );
}
