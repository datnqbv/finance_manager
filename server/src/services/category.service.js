import { Category, Transaction } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Get all categories for a user, or initialize defaults if none exist
 */
export const getCategories = async (userId) => {
  const categories = await Category.findAll({
    where: { userId },
    order: [['type', 'ASC'], ['order', 'ASC']]
  });

  if (categories.length === 0) {
    return await Category.createDefaultCategories(userId);
  }

  return categories;
};

/**
 * Get a single category with its transaction usage count
 */
export const getCategory = async (userId, id) => {
  const category = await Category.findOne({ where: { id, userId } });
  if (!category) {
    throw new ErrorResponse('Không tìm thấy danh mục', 404);
  }

  const transactionCount = await Transaction.count({
    where: { userId, category: category.name }
  });

  return {
    ...category.get({ plain: true }),
    transactionCount
  };
};

/**
 * Create a new category
 */
export const createCategory = async (userId, data) => {
  const { name, icon, color, type, order, group } = data;

  if (!name || name.trim() === '') {
    throw new ErrorResponse('Tên danh mục không được để trống', 400);
  }

  const existingCategory = await Category.findOne({
    where: { userId, name: name.trim() }
  });

  if (existingCategory) {
    throw new ErrorResponse('Danh mục này đã tồn tại', 400);
  }

  try {
    return await Category.create({
      userId,
      name: name.trim(),
      icon: icon || '📁',
      color: color || '#3B82F6',
      type: type || 'expense',
      order: order || 0,
      group: (type || 'expense') === 'income' ? null : (group || 'need'),
      isDefault: false
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ErrorResponse('Danh mục này đã tồn tại', 400);
    }
    throw error;
  }
};

/**
 * Update an existing category
 */
export const updateCategory = async (userId, id, data) => {
  const { name, icon, color, type, order, group } = data;
  const category = await Category.findOne({ where: { id, userId } });

  if (!category) {
    throw new ErrorResponse('Không tìm thấy danh mục', 404);
  }

  // Check if new name already exists
  if (name && name.trim() !== category.name) {
    const existingCategory = await Category.findOne({
      where: { userId, name: name.trim(), id: { [Op.ne]: id } }
    });

    if (existingCategory) {
      throw new ErrorResponse('Tên danh mục này đã tồn tại', 400);
    }

    // Update transactions with old category name
    const oldName = category.name;
    await Transaction.update(
      { category: name.trim() },
      { where: { userId, category: oldName } }
    );
  }

  if (name) category.name = name.trim();
  if (icon) category.icon = icon;
  if (color) category.color = color;
  if (type) category.type = type;
  if (order !== undefined) category.order = order;
  if (group !== undefined) category.group = category.type === 'income' ? null : group;

  await category.save();
  return category;
};

/**
 * Delete a category if not in use
 */
export const deleteCategory = async (userId, id) => {
  const category = await Category.findOne({ where: { id, userId } });
  if (!category) {
    throw new ErrorResponse('Không tìm thấy danh mục', 404);
  }

  const transactionCount = await Transaction.count({
    where: { userId, category: category.name }
  });

  if (transactionCount > 0) {
    throw new ErrorResponse(
      `Không thể xóa danh mục này vì có ${transactionCount} giao dịch đang sử dụng. Vui lòng xóa hoặc chuyển các giao dịch sang danh mục khác trước.`,
      400
    );
  }

  await category.destroy();
  return true;
};

/**
 * Get category statistics
 */
export const getCategoryStats = async (userId, id) => {
  const category = await Category.findOne({ where: { id, userId } });
  if (!category) {
    throw new ErrorResponse('Không tìm thấy danh mục', 404);
  }

  const transactionCount = await Transaction.count({
    where: { userId, category: category.name }
  });

  const totalRows = await Transaction.findAll({
    where: { userId, category: category.name },
    attributes: [[Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']],
    raw: true
  });
  const totalAmount = parseFloat(totalRows[0]?.total || 0);

  const recentTransactions = await Transaction.findAll({
    where: { userId, category: category.name },
    order: [['date', 'DESC']],
    limit: 5
  });

  return {
    category,
    transactionCount,
    totalAmount,
    recentTransactions
  };
};

/**
 * Merge two categories (migrates all transactions from source to target)
 */
export const mergeCategories = async (userId, id, targetCategoryId) => {
  if (!targetCategoryId) {
    throw new ErrorResponse('Vui lòng chọn danh mục đích', 400);
  }

  const sourceCategory = await Category.findOne({ where: { id, userId } });
  const targetCategory = await Category.findOne({ where: { id: targetCategoryId, userId } });

  if (!sourceCategory || !targetCategory) {
    throw new ErrorResponse('Không tìm thấy danh mục', 404);
  }

  const [movedCount] = await Transaction.update(
    { category: targetCategory.name },
    { where: { userId, category: sourceCategory.name } }
  );

  await sourceCategory.destroy();
  return { movedCount, sourceName: sourceCategory.name, targetName: targetCategory.name };
};

/**
 * Bulk reorder categories
 */
export const reorderCategories = async (userId, categories) => {
  if (!Array.isArray(categories)) {
    throw new ErrorResponse('Dữ liệu không hợp lệ', 400);
  }

  const updatePromises = categories.map(({ id, order }) =>
    Category.update({ order }, { where: { id, userId } })
  );

  await Promise.all(updatePromises);
  return true;
};
