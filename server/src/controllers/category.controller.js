import Category from '../models/Category.model.js';
import Transaction from '../models/Transaction.model.js';

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id }).sort({ type: 1, order: 1 });

    // Nếu user chưa có categories, tạo mặc định
    if (categories.length === 0) {
      const defaultCategories = await Category.createDefaultCategories(req.user._id);
      return res.status(200).json({
        success: true,
        count: defaultCategories.length,
        data: defaultCategories
      });
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách danh mục',
      error: error.message
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Đếm số giao dịch sử dụng category này
    const transactionCount = await Transaction.countDocuments({
      userId: req.user._id,
      category: category.name
    });

    res.status(200).json({
      success: true,
      data: { ...category.toObject(), transactionCount }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin danh mục',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
export const createCategory = async (req, res) => {
  try {
    const { name, icon, color, type, order } = req.body;

    // Check if category name already exists for this user
    const existingCategory = await Category.findOne({
      userId: req.user._id,
      name: name.trim()
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục này đã tồn tại'
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: name.trim(),
      icon: icon || '📁',
      color: color || '#3B82F6',
      type: type || 'expense',
      order: order || 0,
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục này đã tồn tại'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo danh mục',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = async (req, res) => {
  try {
    const { name, icon, color, type, order } = req.body;

    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if new name already exists (nếu đổi tên)
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        userId: req.user._id,
        name: name.trim(),
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục này đã tồn tại'
        });
      }

      // Update transactions với category name cũ
      const oldName = category.name;
      await Transaction.updateMany(
        { userId: req.user._id, category: oldName },
        { category: name.trim() }
      );
    }

    // Update category
    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (type) category.type = type;
    if (order !== undefined) category.order = order;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật danh mục',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if category is being used in transactions
    const transactionCount = await Transaction.countDocuments({
      userId: req.user._id,
      category: category.name
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì có ${transactionCount} giao dịch đang sử dụng. Vui lòng xóa hoặc chuyển các giao dịch sang danh mục khác trước.`,
        transactionCount
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa danh mục',
      error: error.message
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/categories/:id/stats
// @access  Private
export const getCategoryStats = async (req, res) => { // Lấy thống kê cho danh mục
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Tổng số giao dịch
    const transactionCount = await Transaction.countDocuments({
      userId: req.user._id,
      category: category.name
    });

    // Tổng số tiền
    const totalAmount = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          category: category.name
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Giao dịch gần nhất
    const recentTransactions = await Transaction.find({
      userId: req.user._id,
      category: category.name
    })
      .sort({ date: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        category,
        transactionCount,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê danh mục',
      error: error.message
    });
  }
};

// @desc    Merge categories (chuyển tất cả transactions từ category này sang category khác)
// @route   POST /api/categories/:id/merge
// @access  Private
export const mergeCategories = async (req, res) => { // Chuyển tất cả giao dịch từ danh mục này sang danh mục khác
  try {
    const { targetCategoryId } = req.body;

    if (!targetCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn danh mục đích'
      });
    }

    const sourceCategory = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    const targetCategory = await Category.findOne({
      _id: targetCategoryId,
      userId: req.user._id
    });

    if (!sourceCategory || !targetCategory) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Update all transactions
    const result = await Transaction.updateMany(
      { userId: req.user._id, category: sourceCategory.name },
      { category: targetCategory.name }
    );

    // Delete source category
    await sourceCategory.deleteOne();

    res.status(200).json({
      success: true,
      message: `Đã chuyển ${result.modifiedCount} giao dịch từ "${sourceCategory.name}" sang "${targetCategory.name}"`,
      movedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi gộp danh mục',
      error: error.message
    });
  }
};

// @desc    Bulk reorder categories
// @route   PUT /api/categories/reorder
// @access  Private
export const reorderCategories = async (req, res) => { // Sắp xếp lại thứ tự danh mục
  try {
    const { categories } = req.body; // Array of { id, order }

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
    }

    // Update order for each category
    const updatePromises = categories.map(({ id, order }) =>
      Category.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Sắp xếp danh mục thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi sắp xếp danh mục',
      error: error.message
    });
  }
};
