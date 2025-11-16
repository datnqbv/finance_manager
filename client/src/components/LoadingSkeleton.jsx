import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  }
};

export const SkeletonCard = ({ className = '' }) => (
  <motion.div
    className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
                dark:from-[#1a1a1a] dark:via-[#2a2a2a] dark:to-[#1a1a1a] 
                rounded-xl ${className}`}
    style={{
      backgroundSize: '200% 100%',
    }}
    animate={shimmer.animate}
    transition={shimmer.transition}
  />
);

export const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <motion.div
    className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
                dark:from-[#1a1a1a] dark:via-[#2a2a2a] dark:to-[#1a1a1a] 
                rounded ${className}`}
    style={{
      backgroundSize: '200% 100%',
    }}
    animate={shimmer.animate}
    transition={shimmer.transition}
  />
);

export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Header */}
    <div className="space-y-3">
      <SkeletonText width="w-64" height="h-8" />
      <SkeletonText width="w-96" height="h-5" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} className="h-32" />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard className="h-96" />
      <SkeletonCard className="h-96" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonCard className="lg:col-span-2 h-80" />
      <SkeletonCard className="h-80" />
    </div>
  </div>
);

export const TransactionSkeleton = () => (
  <div className="space-y-4 animate-in fade-in duration-300">
    <div className="flex justify-between items-center">
      <SkeletonText width="w-48" height="h-8" />
      <SkeletonCard className="w-32 h-10" />
    </div>
    
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div key={i} className="card">
        <div className="flex justify-between items-center">
          <div className="space-y-2 flex-1">
            <SkeletonText width="w-48" height="h-5" />
            <SkeletonText width="w-32" height="h-4" />
          </div>
          <SkeletonText width="w-24" height="h-6" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <SkeletonText width="w-64" height="h-8" />
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="h-32" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard className="h-96" />
      <SkeletonCard className="h-96" />
    </div>

    <SkeletonCard className="h-80" />
  </div>
);

export const CardSkeleton = ({ count = 1 }) => (
  <>
    {[...Array(count)].map((_, i) => (
      <SkeletonCard key={i} className="h-48" />
    ))}
  </>
);
