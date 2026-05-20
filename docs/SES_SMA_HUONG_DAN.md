# Hướng dẫn ngắn: Single Exponential Smoothing (SES) và Simple Moving Average (SMA)

⚠️ **LỖI THỜI**: Tài liệu này là tham khảo lịch sử. **Từ tháng 5/2026**, dự báo chi tiêu đã được thay thế bằng **XGBoost-style Weighted Ensemble Gradient Boosting** trong `server/src/services/xgboost.forecast.service.js`.

Tài liệu này tóm tắt khái niệm, công thức, ví dụ và cách mà dự án trước sử dụng SES/SMA (KHÔNG CÒN DÙNG).

## 1. Tổng quan
- SES (Single Exponential Smoothing): phương pháp làm mượt thời gian (time series) đơn giản, đưa ra dự báo một bước tiếp theo dựa trên mức (level) gần nhất. Phản ứng nhanh với biến động nhờ tham số làm mượt `alpha` (0..1).
- SMA (Simple Moving Average): trung bình của `k` giá trị cuối cùng, dùng để làm mượt và loại bỏ nhiễu ngắn hạn.

## 2. Công thức
- SES (mức L_t):

  L_0 = y_0 (khởi tạo bằng giá trị đầu tiên)

  L_t = alpha * y_t + (1 - alpha) * L_{t-1}

  Dự báo một bước tiếp theo = L_last

- SMA (với window `k`):

  SMA = mean(y_{n-k+1}, ..., y_n)

## 3. Khởi tạo và tham số
- SES: code trong dự án khởi tạo `level = first value` (L0 = y0). Tham số mặc định `alpha = 0.4`.
- SMA: window mặc định `windowSize = 3`, nhưng thực tế trong dự án `windowSize` được giới hạn `Math.min(3, n)`.

## 4. Triển khai trong dự án
- File chứa hàm: `server/src/controllers/stats.controller.js`
  - `singleExponentialSmoothing(data, alpha = 0.4)` — phần cốt lõi SES.
  - `simpleMovingAverage(data, windowSize = 3)` — phần cốt lõi SMA.
  - `smoothingConsistencyScore(data, alpha = 0.4)` — tính điểm độ ổn định dựa trên MAE của lỗi SES (normalised → [0,1]).

Xem các hàm này trực tiếp trong file để hiểu cách sanitize dữ liệu (thay null bằng 0) và cách trả về giá trị không âm.

## 5. Mã mẫu (JS) — tương tự code trong dự án

```js
// Chuẩn hoá
const sanitize = (data) => (Array.isArray(data) && data.length > 0) ? data.map(v => v ?? 0) : [];

function singleExponentialSmoothing(data, alpha = 0.4) {
  const clean = sanitize(data);
  if (clean.length === 0) return 0;
  let level = clean[0];
  for (let i = 1; i < clean.length; i++) {
    level = alpha * clean[i] + (1 - alpha) * level;
  }
  return Math.max(0, level);
}

function simpleMovingAverage(data, windowSize = 3) {
  const clean = sanitize(data);
  if (clean.length === 0) return 0;
  const size = Math.min(windowSize, clean.length);
  // trung bình của k giá trị cuối
  const slice = clean.slice(-size);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
}
```

## 6. Ví dụ nhanh
- Dữ liệu: [100, 120, 110, 130], alpha = 0.4
  - SES steps:
    - L0 = 100
    - L1 = 0.4*120 + 0.6*100 = 108
    - L2 = 0.4*110 + 0.6*108 = 108.4
    - L3 = 0.4*130 + 0.6*108.4 = 116.04 → dự báo tiếp theo ≈ 116
  - SMA (window=3): mean(120,110,130) = 120

## 7. Lưu ý khi dùng thực tế
- Dữ liệu thiếu/null: dự án thay null bằng 0 trước khi tính. Nếu muốn khác (ví dụ giữ null hoặc nội suy), cần thay đổi hàm `sanitize`.
- Khởi tạo SES quan trọng: L0 = first value là lựa chọn đơn giản nhưng ảnh hưởng đến kết quả ban đầu.
- Alpha gần 1 → nhạy, Alpha gần 0 → trơn mượt hơn.

## 8. Ứng dụng trong `forecastSpending()`
- Trong `forecastSpending()` (cùng file `stats.controller.js`) dự án dùng SES để dự báo tổng expense/income tiếp theo và SMA cho forecast theo category (vì category thường có ít dữ liệu và SMA làm mượt tốt hơn).

## 9. Cách thử nghiệm nhanh
1. Tạo file JS nhỏ, import/define 3 hàm trên.
2. Chạy với các dãy mẫu, thay `alpha` và `windowSize` để thấy ảnh hưởng.
3. So sánh SES vs SMA trên dãy có xu hướng tăng/giảm để hiểu phản ứng của từng phương pháp.

---
Nếu bạn muốn, tôi có thể tạo một file JS demo chạy sẵn vài ví dụ và script để bạn chạy local. Muốn tôi làm luôn không? 
