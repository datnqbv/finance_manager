import * as categoryService from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all categories for user
// @route   GET /api/categories
// @access  Private
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getCategories(req.user.id);
  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
export const getCategory = asyncHandler(async (req, res) => {
  const categoryData = await categoryService.getCategory(req.user.id, req.params.id);
  res.json({
    success: true,
    data: categoryData
  });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Tạo danh mục thành công',
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.user.id, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Cập nhật danh mục thành công',
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.user.id, req.params.id);
  res.json({
    success: true,
    message: 'Xóa danh mục thành công'
  });
});

// @desc    Get category statistics
// @route   GET /api/categories/:id/stats
// @access  Private
export const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await categoryService.getCategoryStats(req.user.id, req.params.id);
  res.json({
    success: true,
    data: stats
  });
});

// @desc    Merge categories
// @route   POST /api/categories/:id/merge
// @access  Private
export const mergeCategories = asyncHandler(async (req, res) => {
  const { movedCount, sourceName, targetName } = await categoryService.mergeCategories(req.user.id, req.params.id, req.body.targetCategoryId);
  res.json({
    success: true,
    message: `Đã chuyển ${movedCount} giao dịch từ "${sourceName}" sang "${targetName}"`,
    movedCount
  });
});

// @desc    Bulk reorder categories
// @route   PUT /api/categories/reorder
// @access  Private
export const reorderCategories = asyncHandler(async (req, res) => {
  await categoryService.reorderCategories(req.user.id, req.body.categories);
  res.json({
    success: true,
    message: 'Sắp xếp danh mục thành công'
  });
});
