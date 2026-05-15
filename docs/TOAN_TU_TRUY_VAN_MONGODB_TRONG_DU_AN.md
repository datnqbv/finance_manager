# Các toán tử MongoDB dùng trong dự án

Tài liệu này tổng hợp các toán tử MongoDB thực sự xuất hiện trong mã nguồn `server/src` của dự án. Mỗi toán tử đều có giải thích ngắn gọn và ví dụ theo đúng kiểu truy vấn đang dùng trong project.

## 1. Toán tử truy vấn cơ bản

### `$or` - Hoặc
Chỉ trả về document khi ít nhất một điều kiện đúng.

Ví dụ:
```js
{
  $or: [
    { name: { $regex: pattern } },
    { email: { $regex: pattern } }
  ]
}
```

### `$eq` - Bằng
So sánh bằng giá trị cụ thể.

Ví dụ:
```js
{ amount: { $eq: 100000 } }
```

### `$ne` - Khác
Lọc các document có giá trị khác với giá trị cho trước.

Ví dụ:
```js
{ _id: { $ne: req.params.id } }
```

### `$gt` - Lớn hơn
Lọc giá trị lớn hơn mốc so sánh.

Ví dụ:
```js
{ resetPasswordExpire: { $gt: Date.now() } }
```

### `$gte` - Lớn hơn hoặc bằng
Thường dùng cho lọc theo ngày hoặc khoảng số.

Ví dụ:
```js
{ date: { $gte: startDate } }
```

### `$lte` - Nhỏ hơn hoặc bằng
Thường dùng kết hợp với `$gte` để lọc theo khoảng.

Ví dụ:
```js
{ date: { $gte: startDate, $lte: endDate } }
```

### `$regex` - So khớp theo biểu thức chính quy
Tìm kiếm gần đúng trên chuỗi.

Ví dụ:
```js
{ category: { $regex: search, $options: 'i' } }
```

### `$options` - Tuỳ chọn cho regex
Đi kèm `$regex`, phổ biến nhất là `i` để không phân biệt hoa thường.

Ví dụ:
```js
{ name: { $regex: pattern, $options: 'i' } }
```

### `$type` - Kiểm tra kiểu dữ liệu
Dùng trong index hoặc filter để chỉ nhận một kiểu dữ liệu nhất định.

Ví dụ:
```js
partialFilterExpression: { googleId: { $type: 'string' } }
```

## 2. Toán tử aggregation pipeline

### `$match` - Lọc dữ liệu
Là stage để lọc document trong pipeline.

Ví dụ:
```js
{ $match: { userId: req.user._id, type: 'expense' } }
```

### `$group` - Gom nhóm
Nhóm dữ liệu theo một field hoặc biểu thức để tính tổng, đếm, trung bình...

Ví dụ:
```js
{
  $group: {
    _id: '$category',
    total: { $sum: '$amount' },
    count: { $sum: 1 }
  }
}
```

### `$project` - Chọn/đổi cấu trúc field
Bật/tắt hoặc đổi tên các field kết quả.

Ví dụ:
```js
{
  $project: {
    type: 1,
    amount: 1,
    createdAt: 1
  }
}
```

### `$addFields` - Thêm field tính toán
Thêm field mới vào document đang xử lý.

Ví dụ:
```js
{
  $addFields: {
    relevanceScore: 10,
    dateFormatted: { $dateToString: { format: '%d/%m/%Y', date: '$date' } }
  }
}
```

### `$sort` - Sắp xếp
Sắp xếp kết quả theo một hoặc nhiều field.

Ví dụ:
```js
{ $sort: { relevanceScore: -1, createdAt: -1 } }
```

### `$limit` - Giới hạn số kết quả
Chỉ lấy một số lượng document nhất định.

Ví dụ:
```js
{ $limit: 20 }
```

## 3. Toán tử biểu thức trong aggregation

### `$sum` - Tính tổng
Có thể dùng để cộng dồn giá trị hoặc đếm số lượng.

Ví dụ:
```js
{ total: { $sum: '$amount' }, count: { $sum: 1 } }
```

### `$avg` - Tính trung bình
Tính giá trị trung bình của một field.

Ví dụ:
```js
{ avgAmount: { $avg: '$amount' } }
```

### `$add` - Cộng nhiều giá trị
Dùng để cộng các điểm số hoặc các thành phần tính toán.

Ví dụ:
```js
{ $add: [10, 5, 3, 2] }
```

### `$multiply` - Nhân
Thường dùng để đổi tỷ lệ sang phần trăm.

Ví dụ:
```js
{ $multiply: [{ $divide: ['$spent', '$limit'] }, 100] }
```

### `$divide` - Chia
Phục vụ tính phần trăm hoặc tỷ lệ.

Ví dụ:
```js
{ $divide: ['$currentAmount', '$targetAmount'] }
```

### `$cond` - Điều kiện
Cho phép rẽ nhánh kiểu if/else trong aggregation.

Ví dụ:
```js
{ $cond: [{ $eq: ['$type', 'lend'] }, 1, 0] }
```

### `$regexMatch` - So khớp regex trong aggregation
Dùng trong pipeline để kiểm tra chuỗi có khớp mẫu hay không.

Ví dụ:
```js
{ $regexMatch: { input: '$note', regex: searchRegex } }
```

### `$ifNull` - Giá trị thay thế khi null
Nếu field null hoặc không tồn tại thì trả về giá trị dự phòng.

Ví dụ:
```js
{ $ifNull: ['$dueDate', false] }
```

### `$dateToString` - Định dạng ngày
Chuyển `Date` sang chuỗi theo format mong muốn.

Ví dụ:
```js
{ $dateToString: { format: '%d/%m/%Y', date: '$date' } }
```

### `$dateDiff` - Tính chênh lệch ngày
Dùng để tính số ngày còn lại giữa hai mốc thời gian.

Ví dụ:
```js
{
  $dateDiff: {
    startDate: new Date(),
    endDate: '$deadline',
    unit: 'day'
  }
}
```

### `$year` - Lấy năm từ ngày
Thường dùng để gom nhóm dữ liệu theo năm.

Ví dụ:
```js
{ year: { $year: '$date' } }
```

### `$month` - Lấy tháng từ ngày
Thường dùng để gom nhóm dữ liệu theo tháng.

Ví dụ:
```js
{ month: { $month: '$date' } }
```

### `$isoWeek` - Lấy tuần ISO
Nhóm thống kê theo tuần chuẩn ISO.

Ví dụ:
```js
{ isoWeek: { $isoWeek: '$date' } }
```

### `$isoWeekYear` - Lấy năm ISO của tuần
Đi kèm `$isoWeek` để tránh sai lệch ở ranh giới năm.

Ví dụ:
```js
{ isoYear: { $isoWeekYear: '$date' } }
```

## 4. Toán tử cập nhật

### `$set` - Gán/cập nhật giá trị field
Dùng để cập nhật một hoặc nhiều trường trong document.

Ví dụ:
```js
{ $set: { refreshToken: null } }
```

## 5. Các mẫu dùng nhiều trong dự án

### Tìm kiếm nhiều field
```js
{
  userId: req.user._id,
  $or: [
    { category: { $regex: searchRegex } },
    { note: { $regex: searchRegex } }
  ]
}
```

### Lọc theo khoảng ngày
```js
{
  date: {
    $gte: startDate,
    $lte: endDate
  }
}
```

### Tính tổng theo nhóm
```js
Transaction.aggregate([
  { $match: query },
  { $group: { _id: '$category', total: { $sum: '$amount' } } }
])
```

## 6. Ghi chú nhanh

- Dự án này dùng nhiều nhất các toán tử: `$match`, `$group`, `$sum`, `$or`, `$gte`, `$lte`, `$regex`, `$eq`.
- Phần thống kê dùng thêm các toán tử thời gian như `$year`, `$month`, `$isoWeek`, `$isoWeekYear`, `$dateDiff`.
- Mã nguồn hiện không thấy dùng các toán tử như `$lookup`, `$unwind`, `$in`, `$all`, `$elemMatch`, nên tài liệu này không liệt kê chúng.