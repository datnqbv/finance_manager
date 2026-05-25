import { Meilisearch } from 'meilisearch';

const {
  MEILISEARCH_HOST = 'http://localhost:7700',
  MEILISEARCH_KEY = 'masterKey',
} = process.env;

let meiliClient;

if (process.env.FORCE_SQLITE_IN_TESTS === 'true') {
  // Mock MeiliSearch client for Jest tests
  meiliClient = {
    index: (indexName) => ({
      search: async () => ({ hits: [], estimatedTotalHits: 0 }),
      addDocuments: async () => ({ taskUid: 1 }),
      updateDocuments: async () => ({ taskUid: 1 }),
      deleteDocument: async () => ({ taskUid: 1 }),
      updateSettings: async () => ({ taskUid: 1 }),
      updateFilterableAttributes: async () => ({ taskUid: 1 }),
      updateSearchableAttributes: async () => ({ taskUid: 1 }),
      updateSortableAttributes: async () => ({ taskUid: 1 }),
    }),
  };
} else {
  meiliClient = new Meilisearch({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_KEY,
  });
}

export default meiliClient;
