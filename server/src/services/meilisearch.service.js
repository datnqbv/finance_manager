import meiliClient from '../config/meilisearch.js';

/**
 * Thêm hoặc Cập nhật document vào Index của MeiliSearch
 */
export const syncDocument = async (indexName, document) => {
  if (process.env.FORCE_SQLITE_IN_TESTS === 'true') return;
  try {
    await meiliClient.index(indexName).addDocuments([document]);
  } catch (error) {
    console.error(`❌ MeiliSearch Sync Error [${indexName}]:`, error.message);
  }
};

/**
 * Xoá document khỏi Index của MeiliSearch
 */
export const removeDocument = async (indexName, id) => {
  if (process.env.FORCE_SQLITE_IN_TESTS === 'true') return;
  try {
    await meiliClient.index(indexName).deleteDocument(id);
  } catch (error) {
    console.error(`❌ MeiliSearch Delete Error [${indexName}]:`, error.message);
  }
};

/**
 * Tìm kiếm document trong Index
 */
export const searchDocuments = async (indexName, query, options = {}) => {
  try {
    return await meiliClient.index(indexName).search(query, options);
  } catch (error) {
    console.error(`❌ MeiliSearch Query Error [${indexName}]:`, error.message);
    return { hits: [], estimatedTotalHits: 0 };
  }
};
