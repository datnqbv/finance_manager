import { sequelize } from '../config/sqlserver.js';
import { Op } from 'sequelize';

export let ftsEnabled = false;

/**
 * Kiểm tra cấu hình và trạng thái hoạt động của FTS trên SQL Server
 */
export async function initFtsSupport() {
  try {
    if (sequelize.options.dialect !== 'mssql') {
      ftsEnabled = false;
      return;
    }
    
    // Kiểm tra xem đã có index FTS cho bảng transactions chưa
    const [rows] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM sys.fulltext_indexes 
      WHERE object_id = OBJECT_ID('transactions')
    `);
    
    ftsEnabled = rows && rows[0] && rows[0].count > 0;
    
    if (ftsEnabled) {
      console.log('🔍 Full-Text Search is active and configured on SQL Server.');
    } else {
      console.log('⚠️ Full-Text Search catalog/indexes not yet configured on SQL Server. Falling back to LIKE searches.');
    }
  } catch (e) {
    ftsEnabled = false;
    console.log('⚠️ Failed to check Full-Text Search support (falling back to LIKE search):', e.message);
  }
}

/**
 * Format string query thành FTS query string cho SQL Server CONTAINS
 * Ví dụ: "bún bò" -> '"bún*" AND "bò*"'
 */
export function formatFtsQuery(query) {
  if (!query || typeof query !== 'string') return '';
  
  // Clean special characters but keep alphanumeric, spaces, and standard Vietnamese characters
  // Remove single quotes, double quotes, and asterisks to avoid breaking CONTAINS syntax
  const cleaned = query.replace(/["'*]/g, ' ').trim();
  
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  
  // Format each word as "word*" for prefix matching
  return words.map(w => `"${w}*"`).join(' AND ');
}

/**
 * Loại bỏ dấu tiếng Việt từ một chuỗi (dành cho tìm kiếm không dấu ở Client/SQLite fallback)
 * @param {string} str - Chuỗi tiếng Việt cần xóa dấu
 * @returns {string} Chuỗi không dấu
 */
export function removeVietnameseAccents(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Kiểm tra xem database hiện tại có dùng SQL Server hay không
 */
export function isMssql() {
  return sequelize.options.dialect === 'mssql';
}

/**
 * Tạo điều kiện tìm kiếm FTS hoặc LIKE fallback dựa trên dialect và sự tồn tại của index FTS
 * @param {string|string[]} fields - Tên cột hoặc mảng các cột cần tìm kiếm
 * @param {string} searchQuery - Từ khóa tìm kiếm của người dùng
 * @returns {object} Trả về Sequelize where condition
 */
export function getSearchCondition(fields, searchQuery) {
  if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return {};
  }
  
  const fieldsArray = Array.isArray(fields) ? fields : [fields];
  
  if (isMssql() && ftsEnabled) {
    const queryStr = formatFtsQuery(searchQuery);
    const unaccentedQueryStr = formatFtsQuery(removeVietnameseAccents(searchQuery));
    
    if (queryStr) {
      const escapedQueryStr = queryStr.replace(/'/g, "''");
      const escapedUnaccentedQueryStr = unaccentedQueryStr.replace(/'/g, "''");
      
      const clauses = [];
      for (const field of fieldsArray) {
        // Tìm có dấu trên cột gốc
        clauses.push(`CONTAINS(${field}, '${escapedQueryStr}')`);
        // Tìm không dấu trên cột computed _no_accent
        clauses.push(`CONTAINS(${field}_no_accent, '${escapedUnaccentedQueryStr}')`);
      }
      
      return sequelize.literal(`(${clauses.join(' OR ')})`);
    }
  }
  
  // Trả về điều kiện LIKE fallback (dành cho SQLite trong testing hoặc dev không có SQL Server)
  const unaccentedQuery = removeVietnameseAccents(searchQuery);
  const likeQuery = { [Op.like]: `%${searchQuery}%` };
  const likeQueryUnaccented = { [Op.like]: `%${unaccentedQuery}%` };
  
  const buildLikeClause = (field) => {
    if (searchQuery === unaccentedQuery) {
      return { [field]: likeQuery };
    }
    return {
      [Op.or]: [
        { [field]: likeQuery },
        { [field]: likeQueryUnaccented }
      ]
    };
  };

  if (fieldsArray.length === 1) {
    return buildLikeClause(fieldsArray[0]);
  }
  
  return {
    [Op.or]: fieldsArray.map(field => buildLikeClause(field))
  };
}

// Trigger nodemon restart after FTS database configuration update

