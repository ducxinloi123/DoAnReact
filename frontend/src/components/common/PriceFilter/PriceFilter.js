import React, { useState, useEffect } from 'react';
import styles from './PriceFilter.module.scss';

const PriceFilter = ({ min = 0, max = 10000000, onApplyFilter }) => {
  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);
  const [sliderMin, setSliderMin] = useState(min);
  const [sliderMax, setSliderMax] = useState(max);

  // Format giá thành VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Sync slider với input
  useEffect(() => {
    setSliderMin(minPrice);
    setSliderMax(maxPrice);
  }, [minPrice, maxPrice]);

  const handleMinSliderChange = (e) => {
    const value = Math.min(Number(e.target.value), sliderMax - 10000);
    setSliderMin(value);
    setMinPrice(value);
  };

  const handleMaxSliderChange = (e) => {
    const value = Math.max(Number(e.target.value), sliderMin + 10000);
    setSliderMax(value);
    setMaxPrice(value);
  };

  const handleMinInputChange = (e) => {
    const value = e.target.value === '' ? min : Math.max(min, Number(e.target.value));
    setMinPrice(value);
  };

  const handleMaxInputChange = (e) => {
    const value = e.target.value === '' ? max : Math.min(max, Number(e.target.value));
    setMaxPrice(value);
  };

  const handleApply = () => {
    onApplyFilter(minPrice, maxPrice);
  };

  const handleReset = () => {
    setMinPrice(min);
    setMaxPrice(max);
    setSliderMin(min);
    setSliderMax(max);
    onApplyFilter(min, max);
  };

  // Calculate slider fill percentage
  const minPercent = ((sliderMin - min) / (max - min)) * 100;
  const maxPercent = ((sliderMax - min) / (max - min)) * 100;

  return (
    <div className={styles.filterContainer}>
      
      
      {/* Hiển thị giá trị hiện tại */}
      <div className={styles.priceDisplay}>
        <span className={styles.priceValue}>{formatPrice(sliderMin)}</span>
        <span className={styles.separator}>-</span>
        <span className={styles.priceValue}>{formatPrice(sliderMax)}</span>
      </div>

      {/* Dual Range Slider */}
      <div className={styles.sliderContainer}>
        <div className={styles.sliderTrack}>
          <div 
            className={styles.sliderRange}
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={sliderMin}
          onChange={handleMinSliderChange}
          className={`${styles.sliderThumb} ${styles.sliderThumbMin}`}
          step="10000"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={sliderMax}
          onChange={handleMaxSliderChange}
          className={`${styles.sliderThumb} ${styles.sliderThumbMax}`}
          step="10000"
        />
      </div>

      {/* Input nhập tay */}
      <div className={styles.inputsWrapper}>
        <div className={styles.inputGroup}>
          <label>Từ</label>
          <input
            type="number"
            placeholder="Giá tối thiểu"
            value={minPrice === min ? '' : minPrice}
            onChange={handleMinInputChange}
            min={min}
            max={max}
          />
        </div>
        <span className={styles.inputSeparator}>→</span>
        <div className={styles.inputGroup}>
          <label>Đến</label>
          <input
            type="number"
            placeholder="Giá tối đa"
            value={maxPrice === max ? '' : maxPrice}
            onChange={handleMaxInputChange}
            min={min}
            max={max}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button onClick={handleApply} className={styles.applyBtn}>
          Áp dụng
        </button>
        <button onClick={handleReset} className={styles.resetBtn}>
          Đặt lại
        </button>
      </div>
    </div>
  );
};

export default PriceFilter;