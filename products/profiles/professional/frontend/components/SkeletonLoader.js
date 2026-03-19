/**
 * Skeleton loaders for hero, stats, member rows.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const SkeletonBox = ({ className = '' }) =>
  html`<div className=${`animate-pulse bg-gray-200 rounded ${className}`} />`;

export const HeroSkeleton = () => html`
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex gap-4">
      <${SkeletonBox} className="h-20 w-20 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <${SkeletonBox} className="h-7 w-48" />
        <${SkeletonBox} className="h-4 w-64" />
        <div className="flex gap-4 mt-3">
          ${[1, 2, 3].map((i) => html`<${SkeletonBox} key=${i} className="h-4 w-16" />`)}
        </div>
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      ${[1, 2, 3, 4].map((i) => html`<${SkeletonBox} key=${i} className="h-6 w-20 rounded-lg" />`)}
    </div>
  </div>
`;

export const StatCardSkeleton = () => html`
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <${SkeletonBox} className="h-3 w-20 mb-2" />
    <${SkeletonBox} className="h-8 w-12" />
  </div>
`;

export const StatsGridSkeleton = () => html`
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
    ${[1, 2, 3, 4, 5, 6, 7].map((i) => html`<${StatCardSkeleton} key=${i} />`)}
  </div>
`;

export const MemberRowSkeleton = () => html`
  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
    <${SkeletonBox} className="h-10 w-10 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-1">
      <${SkeletonBox} className="h-4 w-32" />
      <${SkeletonBox} className="h-3 w-24" />
    </div>
  </div>
`;

export const MemberListSkeleton = () => html`
  <div className="space-y-3">
    ${[1, 2, 3, 4, 5].map((i) => html`<${MemberRowSkeleton} key=${i} />`)}
  </div>
`;
