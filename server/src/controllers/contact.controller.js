import {
  submitContactService,
  getContactMessagesList,
  updateContactMessageService,
  deleteContactMessageService
} from '../services/contact.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/contact
export const submitContact = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
  await submitContactService(req.body, ipAddress);

  return res.status(201).json({
    success: true,
    message: 'Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ.',
  });
});

export const getContactMessages = asyncHandler(async (req, res) => {
  const data = await getContactMessagesList(req.query);

  return res.json({
    success: true,
    data
  });
});

export const updateContactMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await updateContactMessageService(id, req.body);

  return res.json({ success: true, message: 'Cập nhật liên hệ thành công', data: item });
});

export const deleteContactMessage = asyncHandler(async (req, res) => {
  await deleteContactMessageService(req.params.id);

  return res.json({ success: true, message: 'Xóa liên hệ thành công' });
});
