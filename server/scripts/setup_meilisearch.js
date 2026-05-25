import meiliClient from '../src/config/meilisearch.js';
import { testConnection, sequelize } from '../src/config/sqlserver.js';
import { Transaction, Category, Budget, Goal, Debt, ContactMessage, User } from '../src/models/sequelize/index.js';

const INDEXES = [
  {
    name: 'transactions',
    model: Transaction,
    searchable: ['category', 'note'],
    filterable: ['userId', 'type', 'date', 'amount'],
    sortable: ['date', 'amount']
  },
  {
    name: 'categories',
    model: Category,
    searchable: ['name'],
    filterable: ['userId', 'type', 'isDefault'],
    sortable: ['order']
  },
  {
    name: 'budgets',
    model: Budget,
    searchable: ['categoryName'],
    filterable: ['userId', 'isActive', 'period'],
    sortable: ['createdAt']
  },
  {
    name: 'goals',
    model: Goal,
    searchable: ['name', 'description'],
    filterable: ['userId', 'isAchieved'],
    sortable: ['deadline']
  },
  {
    name: 'debts',
    model: Debt,
    searchable: ['personName', 'description'],
    filterable: ['userId', 'type', 'status'],
    sortable: ['createdAt']
  },
  {
    name: 'contact_messages',
    model: ContactMessage,
    searchable: ['name', 'email', 'subject', 'message'],
    filterable: ['status'],
    sortable: ['createdAt']
  },
  {
    name: 'users',
    model: User,
    searchable: ['name', 'email'],
    filterable: ['role'],
    sortable: ['createdAt']
  }
];

async function setupMeiliSearch() {
  try {
    await testConnection();
    console.log('🔄 Đang cấu hình và đồng bộ dữ liệu lên MeiliSearch...');

    for (const info of INDEXES) {
      const index = meiliClient.index(info.name);
      
      // Update Settings
      await index.updateSearchableAttributes(info.searchable);
      await index.updateFilterableAttributes(info.filterable);
      if (info.sortable) await index.updateSortableAttributes(info.sortable);
      
      console.log(`✅ Cập nhật cấu hình index '${info.name}' thành công.`);

      // Sync Data
      const records = await info.model.findAll({ raw: true });
      if (records.length > 0) {
        // Meilisearch requires numeric or string IDs, but our UUIDs are strings which is fine
        // Convert Date objects to unix timestamps or strings so Meili can sort if needed.
        // The default raw object is usually acceptable for JSON upload
        await index.addDocuments(records);
        console.log(`📡 Đã đồng bộ ${records.length} bản ghi vào '${info.name}'.`);
      }
    }

    console.log('🎉 Cài đặt MeiliSearch hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi cài đặt MeiliSearch:', error);
    process.exit(1);
  }
}

setupMeiliSearch();
