/**
 * tests/helpers/db.js
 * Helper khởi tạo/đóng MongoDB in-memory cho tests.
 * Mỗi test file gọi connect() trong beforeAll và close() trong afterAll.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

/**
 * Khởi động MongoMemoryServer và kết nối Mongoose
 */
export const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

/**
 * Đóng kết nối và tắt MongoMemoryServer
 */
export const close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

/**
 * Xóa toàn bộ data trong tất cả collections (chạy sau mỗi test)
 */
export const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
