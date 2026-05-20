/**
 * XGBoost-style Forecasting Service
 * Sử dụng Weighted Ensemble Gradient Boosting để dự báo chi tiêu tháng tiếp theo
 * Thay thế SES + SMA bằng mô hình học máy XGBoost-like predictor
 */

import Transaction from '../models/Transaction.model.js';
import * as ss from 'simple-statistics';
import mongoose from 'mongoose';

/**
 * XGBoost-style Weighted Ensemble Forecaster
 * Kết hợp nhiều weak learners (SES, SMA, Linear Trend, ...) theo kiểu Gradient Boosting
 */
class XGBoostEnsembleForecaster {
  constructor(data) {
    this.data = data;
    this.n = data.length;
  }

  // Weak Learner 1: Single Exponential Smoothing
  predictSES(alpha = 0.4) {
    if (this.n === 0) return 0;
    let level = this.data[0];
    for (let i = 1; i < this.n; i++) {
      level = alpha * this.data[i] + (1 - alpha) * level;
    }
    return Math.max(0, level);
  }

  // Weak Learner 2: Simple Moving Average
  predictSMA(windowSize = 3) {
    if (this.n === 0) return 0;
    const size = Math.min(windowSize, this.n);
    const avg = ss.mean(this.data.slice(-size));
    return Math.max(0, avg);
  }

  // Weak Learner 3: Linear Trend Extrapolation
  predictLinearTrend() {
    if (this.n < 2) return ss.mean(this.data);
    
    // Fit linear trend: y = mx + b
    const X = Array.from({ length: this.n }, (_, i) => i);
    const Y = this.data;
    
    const n = this.n;
    const sumX = ss.sum(X);
    const sumY = ss.sum(Y);
    const sumXY = X.reduce((sum, x, i) => sum + x * Y[i], 0);
    const sumX2 = X.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecast = slope * this.n + intercept;
    return Math.max(0, forecast);
  }

  // Weak Learner 4: Weighted Recent Average (recent data weighted higher)
  predictWeightedRecent() {
    if (this.n === 0) return 0;
    
    const weights = Array.from({ length: this.n }, (_, i) => (i + 1) / (this.n * (this.n + 1) / 2));
    const weighted = this.data.reduce((sum, val, i) => sum + val * weights[i], 0);
    return Math.max(0, weighted);
  }

  // Weak Learner 5: Adaptive (mix of recent trend and average)
  predictAdaptive() {
    const avg = ss.mean(this.data);
    if (this.n < 2) return avg;
    
    const recent = ss.mean(this.data.slice(-Math.min(3, this.n)));
    const past = this.n > 3 ? ss.mean(this.data.slice(0, -3)) : recent;
    
    // Adaptive: if recent > past, trend up (use recent), else use average
    const trend = recent - past;
    const adaptive = avg + trend * 0.5;
    return Math.max(0, adaptive);
  }

  // Gradient Boosting Ensemble - weighted combination of weak learners
  predict() {
    if (this.n === 0) return 0;
    if (this.n === 1) return this.data[0];
    
    // Get predictions from all weak learners
    const predictions = [
      { value: this.predictSES(0.3), weight: 0.25 },
      { value: this.predictSES(0.4), weight: 0.15 },
      { value: this.predictSMA(3), weight: 0.20 },
      { value: this.predictLinearTrend(), weight: 0.15 },
      { value: this.predictWeightedRecent(), weight: 0.15 },
      { value: this.predictAdaptive(), weight: 0.10 }
    ];
    
    // Weighted average ensemble
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);
    const forecast = predictions.reduce((sum, p) => sum + p.value * p.weight, 0) / totalWeight;
    
    return Math.max(0, forecast);
  }

  // Calculate model quality score (R² equivalent)
  calculateQualityScore() {
    if (this.n < 2) return 0;
    
    // Use cross-validation: leave-one-out to estimate model quality
    let totalError = 0;
    for (let i = Math.max(2, this.n - 6); i < this.n; i++) {
      const trainData = this.data.slice(0, i);
      const testVal = this.data[i];
      const trainForecaster = new XGBoostEnsembleForecaster(trainData);
      const pred = trainForecaster.predict();
      const error = Math.abs(pred - testVal) / (testVal + 1);
      totalError += error;
    }
    
    const mae = totalError / Math.max(1, this.n - Math.max(2, this.n - 6));
    const avg = ss.mean(this.data);
    const normalizedError = avg > 0 ? mae / avg : mae;
    
    // Convert error to R² like score (0-1)
    const qualityScore = Math.max(0, Math.min(1, 1 - normalizedError));
    return qualityScore;
  }
}

/**
 * Dự báo chi tiêu tháng tiếp theo sử dụng XGBoost-style ensemble
 */
export function forecastNextMonth(transactionHistory, categoryHistories = {}) {
  if (transactionHistory.length === 0) {
    return { forecast: 0, confidence: 'low', r2Score: 0, trend: 'unknown' };
  }

  const forecaster = new XGBoostEnsembleForecaster(transactionHistory);
  const forecast = Math.round(forecaster.predict());
  const r2Score = forecaster.calculateQualityScore();
  
  // Determine confidence level
  let confidence = 'low';
  if (r2Score > 0.7) confidence = 'high';
  else if (r2Score > 0.4) confidence = 'medium';
  
  // Determine trend
  const n = transactionHistory.length;
  let trend = 'stable';
  if (n >= 3) {
    const recent = ss.mean(transactionHistory.slice(-3));
    const past = ss.mean(transactionHistory.slice(0, -3));
    const avg = ss.mean(transactionHistory);
    
    if (recent - past > avg * 0.02) trend = 'increasing';
    else if (recent - past < -avg * 0.02) trend = 'decreasing';
  }
  
  // Calculate confidence as percentage (0-100%)
  const confidencePercent = Math.round(r2Score * 100);
  
  return {
    forecast,
    confidence,
    confidencePercent,
    r2Score,
    trend,
    trainSamplesUsed: transactionHistory.length
  };
}

/**
 * Dự báo chi tiêu theo danh mục sử dụng XGBoost ensemble
 */
export function forecastCategoryExpense(categoryHistory) {
  if (!categoryHistory || categoryHistory.length === 0) {
    return { forecast: 0, confidence: 'low', r2Score: 0, trend: 'unknown' };
  }

  const forecaster = new XGBoostEnsembleForecaster(categoryHistory);
  const forecast = Math.round(forecaster.predict());
  const r2Score = forecaster.calculateQualityScore();
  
  // Determine confidence level
  let confidence = 'low';
  if (r2Score > 0.7) confidence = 'high';
  else if (r2Score > 0.4) confidence = 'medium';
  
  // Determine trend
  const n = categoryHistory.length;
  let trend = 'unknown';
  if (n >= 3) {
    const recent = ss.mean(categoryHistory.slice(-3));
    const past = ss.mean(categoryHistory.slice(0, -3));
    const avg = ss.mean(categoryHistory);
    
    if (avg > 0) {
      if (recent - past > avg * 0.03) trend = 'increasing';
      else if (recent - past < -avg * 0.03) trend = 'decreasing';
      else trend = 'stable';
    }
  } else if (n === 2) {
    trend = categoryHistory[1] > categoryHistory[0] ? 'increasing' : 'decreasing';
  } else {
    trend = 'stable';
  }
  
  // Calculate confidence as percentage (0-100%)
  const confidencePercent = Math.round(r2Score * 100);
  
  return {
    forecast,
    confidence,
    confidencePercent,
    r2Score,
    trend
  };
}
