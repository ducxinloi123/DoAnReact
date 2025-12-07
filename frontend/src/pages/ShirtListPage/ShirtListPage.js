import React, { useState, useMemo } from 'react';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import ProductCard from '../../components/product/ProductCard/ProductCard';
import styles from './ShirtListPage.module.scss';
import { shirtProducts } from '../../data/mockData';

// --- Imports Component ---
import PriceFilter from '../../components/common/PriceFilter/PriceFilter'; 
import ColorFilter from '../../components/common/ColorFilter/ColorFilter';

const getUniqueColors = (products) => {
    const colorMap = new Map();
    products.forEach(product => {
        if (product.inventory) {
            product.inventory.forEach(item => {
                if (item.color && item.colorHex && !colorMap.has(item.color)) {
                    colorMap.set(item.color, item.colorHex);
                }
            });
        }
    });
    return Array.from(colorMap, ([name, hex]) => ({ name, hex }));
};

const AVAILABLE_COLORS = getUniqueColors(shirtProducts);

const ShirtListPage = () => {
    const [sortOrder, setSortOrder] = useState('default');
    const [priceFilter, setPriceFilter] = useState({ min: 0, max: Infinity });
    const [colorFilter, setColorFilter] = useState([]);

    const handlePriceFilterChange = (min, max) => {
        setPriceFilter({ min, max });
    };

    const handleColorFilterChange = (selectedColors) => {
        setColorFilter(selectedColors);
    };

    const sortedProducts = useMemo(() => {
        let products = [...shirtProducts];
        products = products.filter(
            (product) =>
                product.price >= priceFilter.min && product.price <= priceFilter.max
        );
        if (colorFilter.length > 0) {
            products = products.filter(product =>
                product.inventory && product.inventory.some(item => colorFilter.includes(item.color))
            );
        }
        switch (sortOrder) {
            case 'price-asc': products.sort((a, b) => a.price - b.price); break;
            case 'price-desc': products.sort((a, b) => b.price - a.price); break;
            case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': products.sort((a, b) => b.name.localeCompare(a.name)); break;
            default: break;
        }
        return products;
    }, [sortOrder, priceFilter, colorFilter]);

    return (
        <PageLayout pageTitle="Áo xuân hè">
            <div className={styles.container}>
                
                {/* Cấu trúc Layout mới: Flex row */}
                <div className={styles.layoutWrapper}>
                    
                    {/* 1. CỘT TRÁI (SIDEBAR) - Chứa bộ lọc */}
                    <aside className={styles.sidebar}>
                        {/* Bộ lọc giá */}
                        <div className={`${styles.sidebarSection} ${styles.priceFilter}`}>
                            <h4>Khoảng giá</h4>
                            <PriceFilter onApplyFilter={handlePriceFilterChange} />
                        </div>

                        {/* Bộ lọc màu */}
                        <div className={`${styles.sidebarSection} ${styles.colorFilter}`}>
                            
                            <ColorFilter
                                availableColors={AVAILABLE_COLORS}
                                onChange={handleColorFilterChange}
                            />
                        </div>
                    </aside>

                    {/* 2. CỘT PHẢI (MAIN CONTENT) - Chứa Sort & Grid sản phẩm */}
                    <main className={styles.mainContent}>
                        
                        {/* Thanh điều khiển trên cùng (Sort & Count) */}
                        <div className={styles.topControlBar}>
                            <div className={styles.productCount}>
                                Tìm thấy <span>{sortedProducts.length}</span> sản phẩm
                            </div>
                            
                            <div className={styles.sortOptions}>
                                <label htmlFor="sort">Sắp xếp:</label>
                                <select 
                                    id="sort" 
                                    value={sortOrder} 
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className={styles.sortSelect}
                                >
                                    <option value="default">Mặc định</option>
                                    <option value="price-asc">Giá tăng dần</option>
                                    <option value="price-desc">Giá giảm dần</option>
                                    <option value="name-asc">Tên A-Z</option>
                                    <option value="name-desc">Tên Z-A</option>
                                </select>
                            </div>
                        </div>

                        {/* Lưới sản phẩm */}
                        <div className={styles.productGrid}>
                            {sortedProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Không tìm thấy */}
                        {sortedProducts.length === 0 && (
                            <div className={styles.noResults}>
                                <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </PageLayout>
    );
};

export default ShirtListPage;