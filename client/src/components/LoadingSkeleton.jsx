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
    style={{ backgroundSize: '200% 100%' }}
    animate={shimmer.animate}
    transition={shimmer.transition}
  />
);

export const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <motion.div
    className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
                dark:from-[#1a1a1a] dark:via-[#2a2a2a] dark:to-[#1a1a1a] 
                rounded ${className}`}
    style={{ backgroundSize: '200% 100%' }}
    animate={shimmer.animate}
    transition={shimmer.transition}
  />
);

// ── Reusable row for lists ─────────────────────────────────────────────────
const SkeletonRow = ({ cols }) => (
  <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 flex items-center gap-3">
    {cols}
  </div>
);

// ── Page header (title + badge + button) ──────────────────────────────────
const SkeletonPageHeader = ({ hasButton = true }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <SkeletonText width="w-40" height="h-6" />
        <SkeletonText width="w-14" height="h-5" className="rounded-full" />
      </div>
      <SkeletonText width="w-64" height="h-4" />
    </div>
    {hasButton && <SkeletonCard className="w-32 h-10 rounded-xl" />}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════════════════
export const DashboardSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="space-y-3">
      <SkeletonText width="w-64" height="h-8" />
      <SkeletonText width="w-96" height="h-5" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} className="h-32" />)}
    </div>
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

// ═══════════════════════════════════════════════════════════════════════════
// Transactions
// ═══════════════════════════════════════════════════════════════════════════
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

export const TransactionsPageSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Header */}
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div className="space-y-2">
        <SkeletonText width="w-36" height="h-8" />
        <SkeletonText width="w-56" height="h-4" />
      </div>
      <div className="flex gap-2">
        <SkeletonCard className="w-24 h-10 rounded-xl" />
        <SkeletonCard className="w-24 h-10 rounded-xl" />
        <SkeletonCard className="w-32 h-10 rounded-xl" />
      </div>
    </div>
    {/* Filter bar */}
    <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4">
      <div className="flex flex-wrap gap-3">
        <SkeletonCard className="h-10 w-48 rounded-xl flex-1" />
        <SkeletonCard className="h-10 w-32 rounded-xl" />
        <SkeletonCard className="h-10 w-32 rounded-xl" />
        <SkeletonCard className="h-10 w-32 rounded-xl" />
      </div>
    </div>
    {/* Rows */}
    <div className="space-y-3">
      {[...Array(7)].map((_, i) => (
        <SkeletonRow key={i} cols={<>
          <SkeletonCard className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-40" height="h-4" />
            <SkeletonText width="w-24" height="h-3" />
          </div>
          <SkeletonText width="w-20" height="h-5" />
        </>} />
      ))}
    </div>
    {/* Pagination */}
    <div className="flex justify-center gap-2">
      {[...Array(5)].map((_, i) => <SkeletonCard key={i} className="w-9 h-9 rounded-lg" />)}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════════════════════
export const CategoriesSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <SkeletonPageHeader />
    {/* Filter tabs */}
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-9 w-24 rounded-xl" />)}
    </div>
    {/* Two-column grid */}
    {['Thu nhập', 'Chi tiêu'].map((_, si) => (
      <div key={si} className="space-y-3">
        <SkeletonText width="w-28" height="h-5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 flex items-start gap-3">
              <SkeletonCard className="w-12 h-12 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <SkeletonText width="w-24" height="h-4" />
                <SkeletonText width="w-16" height="h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Budgets
// ═══════════════════════════════════════════════════════════════════════════
export const BudgetsSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <SkeletonPageHeader />
    {/* Summary bar */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 space-y-2">
          <SkeletonText width="w-16" height="h-3" />
          <SkeletonText width="w-24" height="h-5" />
        </div>
      ))}
    </div>
    {/* Budget cards */}
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border-l-4 border-l-gray-200 dark:border-l-[#2a2a2a] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <SkeletonText width="w-36" height="h-5" />
              <SkeletonText width="w-20" height="h-3" />
            </div>
            <div className="flex gap-2">
              <SkeletonCard className="w-8 h-8 rounded-lg" />
              <SkeletonCard className="w-8 h-8 rounded-lg" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <SkeletonText width="w-24" height="h-3" />
              <SkeletonText width="w-12" height="h-3" />
            </div>
            <SkeletonCard className="h-2 w-full rounded-full" />
          </div>
          <div className="flex justify-between">
            <SkeletonText width="w-20" height="h-3" />
            <SkeletonText width="w-20" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Goals
// ═══════════════════════════════════════════════════════════════════════════
export const GoalsSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <SkeletonPageHeader />
    {/* Stats bar */}
    <div className="grid grid-cols-3 gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 space-y-1.5">
          <SkeletonText width="w-16" height="h-3" />
          <SkeletonText width="w-10" height="h-6" />
        </div>
      ))}
    </div>
    {/* Filter tabs */}
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-9 w-24 rounded-xl" />)}
    </div>
    {/* Goal cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <SkeletonCard className="w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-32" height="h-5" />
              <SkeletonText width="w-24" height="h-3" />
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <SkeletonCard className="w-8 h-8 rounded-lg" />
              <SkeletonCard className="w-8 h-8 rounded-lg" />
            </div>
          </div>
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <SkeletonText width="w-20" height="h-3" />
              <SkeletonText width="w-10" height="h-3" />
            </div>
            <SkeletonCard className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <SkeletonText width="w-24" height="h-3" />
              <SkeletonText width="w-24" height="h-3" />
            </div>
          </div>
          <SkeletonCard className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Debts
// ═══════════════════════════════════════════════════════════════════════════
export const DebtsSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <SkeletonPageHeader />
    {/* Summary stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 space-y-2">
          <SkeletonText width="w-16" height="h-3" />
          <SkeletonText width="w-28" height="h-5" />
        </div>
      ))}
    </div>
    {/* Filter tabs */}
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-9 w-24 rounded-xl" />)}
    </div>
    {/* Debt cards */}
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <SkeletonCard className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="space-y-2">
                <SkeletonText width="w-32" height="h-5" />
                <div className="flex gap-2">
                  <SkeletonText width="w-16" height="h-3" />
                  <SkeletonText width="w-20" height="h-3" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <SkeletonCard className="w-8 h-8 rounded-lg" />
              <SkeletonCard className="w-8 h-8 rounded-lg" />
            </div>
          </div>
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <SkeletonText width="w-24" height="h-3" />
              <SkeletonText width="w-12" height="h-3" />
            </div>
            <SkeletonCard className="h-2 w-full rounded-full" />
          </div>
          <div className="flex justify-between">
            <SkeletonText width="w-20" height="h-3" />
            <SkeletonText width="w-20" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════════════════
export const StatisticsPageSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="space-y-2">
        <SkeletonText width="w-32" height="h-6" />
        <SkeletonText width="w-56" height="h-4" />
      </div>
      <div className="flex gap-2">
        <SkeletonCard className="h-9 w-28 rounded-xl" />
        <SkeletonCard className="h-9 w-28 rounded-xl" />
      </div>
    </div>
    {/* Tab bar */}
    <div className="flex gap-1.5 flex-wrap">
      {[...Array(5)].map((_, i) => <SkeletonCard key={i} className="h-9 w-28 rounded-xl" />)}
    </div>
    {/* KPI cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 border-l-gray-200 dark:border-l-[#2a2a2a] rounded-2xl p-4 space-y-2">
          <SkeletonText width="w-20" height="h-3" />
          <SkeletonText width="w-32" height="h-6" />
          <SkeletonText width="w-16" height="h-3" />
        </div>
      ))}
    </div>
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-3">
        <SkeletonText width="w-32" height="h-5" />
        <SkeletonCard className="h-64 w-full rounded-xl" />
      </div>
      <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-3">
        <SkeletonText width="w-32" height="h-5" />
        <SkeletonCard className="h-64 w-full rounded-xl" />
      </div>
    </div>
    <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-3">
      <SkeletonText width="w-32" height="h-5" />
      <SkeletonCard className="h-56 w-full rounded-xl" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Legacy helpers
// ═══════════════════════════════════════════════════════════════════════════
export const StatsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <SkeletonText width="w-64" height="h-8" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-32" />)}
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
    {[...Array(count)].map((_, i) => <SkeletonCard key={i} className="h-48" />)}
  </>
);

// ═══════════════════════════════════════════════════════════════════════════
// Wallets
// ═══════════════════════════════════════════════════════════════════════════
export const WalletsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="flex justify-between items-center flex-wrap gap-4">
      <div className="space-y-2">
        <SkeletonText width="w-40" height="h-8" />
        <SkeletonText width="w-72" height="h-4" />
      </div>
      <SkeletonCard className="w-36 h-10 rounded-xl" />
    </div>
    
    {/* Grid of Wallet Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonCard className="w-10 h-10 rounded-xl" />
            <SkeletonCard className="w-8 h-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <SkeletonText width="w-24" height="h-4" />
            <SkeletonText width="w-36" height="h-6" />
          </div>
        </div>
      ))}
    </div>

    {/* Quick Transfer Section */}
    <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-4">
      <SkeletonText width="w-48" height="h-5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard className="h-10 rounded-xl" />
        <SkeletonCard className="h-10 rounded-xl" />
        <SkeletonCard className="h-10 rounded-xl" />
      </div>
      <SkeletonCard className="h-11 w-32 rounded-xl" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Recurring Transactions
// ═══════════════════════════════════════════════════════════════════════════
export const RecurringTransactionsSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Header Banner Shimmer */}
    <div className="rounded-3xl bg-gray-200 dark:bg-[#1a1a1a] p-6 space-y-4">
      <SkeletonText width="w-24" height="h-4" />
      <SkeletonText width="w-64" height="h-9" />
      <SkeletonText width="w-full" height="h-4" />
    </div>

    {/* Table View */}
    <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-[#222222]">
        <SkeletonText width="w-32" height="h-5" />
      </div>
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonRow key={i} cols={<>
            <SkeletonText width="w-8" height="h-4" className="mx-auto" />
            <SkeletonCard className="w-16 h-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-36" height="h-4" />
              <SkeletonText width="w-24" height="h-3" />
            </div>
            <SkeletonText width="w-24" height="h-4" />
            <SkeletonText width="w-20" height="h-4" />
            <SkeletonText width="w-16" height="h-4" />
            <SkeletonText width="w-16" height="h-5" />
            <div className="flex gap-2">
              <SkeletonCard className="w-7 h-7 rounded-lg" />
              <SkeletonCard className="w-7 h-7 rounded-lg" />
            </div>
          </>} />
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Profile
// ═══════════════════════════════════════════════════════════════════════════
export const ProfileSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="space-y-2">
      <SkeletonText width="w-36" height="h-8" />
      <SkeletonText width="w-64" height="h-4" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Card */}
      <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
        <SkeletonCard className="w-24 h-24 rounded-full" />
        <div className="space-y-2 w-full flex flex-col items-center">
          <SkeletonText width="w-32" height="h-5" />
          <SkeletonText width="w-48" height="h-4" />
          <SkeletonCard className="w-16 h-5 rounded-full" />
        </div>
        <div className="border-t border-gray-100 dark:border-[#222222] w-full pt-4 space-y-3">
          <div className="flex justify-between"><SkeletonText width="w-20" height="h-4" /><SkeletonText width="w-24" height="h-4" /></div>
          <div className="flex justify-between"><SkeletonText width="w-20" height="h-4" /><SkeletonText width="w-24" height="h-4" /></div>
        </div>
      </div>

      {/* Edit Form Card */}
      <div className="lg:col-span-2 bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-6 space-y-6">
        <div className="space-y-4">
          <SkeletonText width="w-40" height="h-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><SkeletonText width="w-16" height="h-3" /><SkeletonCard className="h-10 rounded-xl" /></div>
            <div className="space-y-2"><SkeletonText width="w-16" height="h-3" /><SkeletonCard className="h-10 rounded-xl" /></div>
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#222222]">
          <SkeletonText width="w-40" height="h-5" />
          <div className="space-y-2"><SkeletonText width="w-16" height="h-3" /><SkeletonCard className="h-10 rounded-xl" /></div>
        </div>
        <SkeletonCard className="w-32 h-11 rounded-xl" />
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// VIP Subscription
// ═══════════════════════════════════════════════════════════════════════════
export const VipSubscriptionSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Gold Crown/Premium Banner */}
    <div className="rounded-3xl bg-gray-200 dark:bg-[#1a1a1a] p-8 text-center space-y-4">
      <SkeletonCard className="w-16 h-16 rounded-full mx-auto" />
      <SkeletonText width="w-48" height="h-6" className="mx-auto" />
      <SkeletonText width="w-80" height="h-4" className="mx-auto" />
    </div>

    {/* Benefits and Pricing Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-6 text-center flex flex-col items-center space-y-6">
          <div className="space-y-2">
            <SkeletonText width="w-24" height="h-4" className="mx-auto" />
            <SkeletonText width="w-32" height="h-8" className="mx-auto" />
          </div>
          <div className="space-y-3 w-full border-t border-b border-gray-100 dark:border-[#222222] py-4">
            <SkeletonText width="w-40" height="h-4" className="mx-auto" />
            <SkeletonText width="w-44" height="h-4" className="mx-auto" />
            <SkeletonText width="w-36" height="h-4" className="mx-auto" />
          </div>
          <SkeletonCard className="w-full h-11 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Admin Dashboard
// ═══════════════════════════════════════════════════════════════════════════
export const AdminDashboardSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    <div className="space-y-2">
      <SkeletonText width="w-48" height="h-8" />
      <SkeletonText width="w-64" height="h-4" />
    </div>

    {/* Admin Card Metrics */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonText width="w-24" height="h-3" />
            <SkeletonText width="w-16" height="h-6" />
          </div>
          <SkeletonCard className="w-12 h-12 rounded-xl" />
        </div>
      ))}
    </div>

    {/* Admin Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-3">
        <SkeletonText width="w-36" height="h-5" />
        <SkeletonCard className="h-80 w-full rounded-xl" />
      </div>
      <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5 space-y-3">
        <SkeletonText width="w-36" height="h-5" />
        <SkeletonCard className="h-80 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Admin Tables (General representation for Users, Payments, Contacts, Visits)
// ═══════════════════════════════════════════════════════════════════════════
export const AdminTableSkeleton = () => (
  <div className="space-y-5 animate-in fade-in duration-300">
    <div className="space-y-2">
      <SkeletonText width="w-36" height="h-8" />
      <SkeletonText width="w-56" height="h-4" />
    </div>

    {/* Search/Filter Bar */}
    <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4">
      <div className="flex flex-wrap gap-3">
        <SkeletonCard className="h-10 w-64 rounded-xl" />
        <SkeletonCard className="h-10 w-32 rounded-xl" />
      </div>
    </div>

    {/* Data Table rows */}
    <div className="bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl overflow-hidden p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <SkeletonRow key={i} cols={<>
          <SkeletonText width="w-12" height="h-4" />
          <SkeletonCard className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-grow space-y-1.5">
            <SkeletonText width="w-40" height="h-4" />
            <SkeletonText width="w-32" height="h-3" />
          </div>
          <SkeletonText width="w-24" height="h-4" />
          <SkeletonCard className="w-16 h-5 rounded-full" />
          <SkeletonCard className="w-20 h-8 rounded-lg" />
        </>} />
      ))}
    </div>

    {/* Pagination */}
    <div className="flex justify-center gap-2">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} className="w-9 h-9 rounded-lg" />)}
    </div>
  </div>
);
