import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import ProductCard from '../../components/product/ProductCard/ProductCard';
import styles from './CollectionPage.module.scss';
import { shirtProducts, pantProducts, accessoryProducts } from '../../data/mockData';
import { slugify } from '../../helpers/slugify';

// Components bộ lọc
import PriceFilter from '../../components/common/PriceFilter/PriceFilter';
import ColorFilter from '../../components/common/ColorFilter/ColorFilter';

// Gom tất cả sản phẩm lại
const allProducts = [...shirtProducts, ...pantProducts, ...accessoryProducts];

// Hàm lấy màu (chỉ lấy màu có trong danh sách sản phẩm hiện tại)
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

const CollectionPage = () => {
    const { subCategory: subCategorySlug } = useParams();

    // --- State cho bộ lọc & Sắp xếp ---
    const [sortOrder, setSortOrder] = useState('default');
    const [priceFilter, setPriceFilter] = useState({ min: 0, max: Infinity });
    const [colorFilter, setColorFilter] = useState([]);

    // --- 1. Lọc sản phẩm theo SubCategory (Logic gốc) ---
    const baseProducts = useMemo(() => {
        return allProducts.filter(p => slugify(p.subCategory) === subCategorySlug);
    }, [subCategorySlug]);

    // --- 2. Tính toán màu có sẵn (Chỉ dựa trên các sản phẩm của danh mục này) ---
    // Ví dụ: Nếu danh mục là "Quần Short" thì chỉ hiện màu của quần short
    const availableColors = useMemo(() => getUniqueColors(baseProducts), [baseProducts]);

    // --- 3. Reset bộ lọc khi chuyển sang danh mục khác ---
    useEffect(() => {
        setPriceFilter({ min: 0, max: Infinity });
        setColorFilter([]);
        setSortOrder('default');
    }, [subCategorySlug]);

    // --- 4. Logic Lọc chi tiết (Giá, Màu, Sort) ---
    const sortedProducts = useMemo(() => {
        let products = [...baseProducts];

        // Lọc giá
        products = products.filter(
            (product) => product.price >= priceFilter.min && product.price <= priceFilter.max
        );

        // Lọc màu
        if (colorFilter.length > 0) {
            products = products.filter(product =>
                product.inventory && product.inventory.some(item => colorFilter.includes(item.color))
            );
        }

        // Sắp xếp
        switch (sortOrder) {
            case 'price-asc': products.sort((a, b) => a.price - b.price); break;
            case 'price-desc': products.sort((a, b) => b.price - a.price); break;
            case 'name-asc': products.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'name-desc': products.sort((a, b) => b.name.localeCompare(a.name)); break;
            default: break;
        }
        return products;
    }, [baseProducts, sortOrder, priceFilter, colorFilter]);

    // Lấy tiêu đề trang
    const pageTitle = baseProducts.length > 0
        ? baseProducts[0].subCategory
        : subCategorySlug.replace(/-/g, ' ');

    // Handlers
    const handlePriceFilterChange = (min, max) => setPriceFilter({ min, max });
    const handleColorFilterChange = (selectedColors) => setColorFilter(selectedColors);

    return (
        <PageLayout pageTitle={pageTitle}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>{pageTitle}</h1>

                <div className={styles.layoutWrapper}>
                    {/* --- CỘT TRÁI (SIDEBAR) --- */}
                    <aside className={styles.sidebar}>
                        <div className={`${styles.sidebarSection} ${styles.priceFilter}`}>
                            <h4>Khoảng giá</h4>
                            {/* Key giúp reset component khi đổi danh mục */}
                            <PriceFilter key={`price-${subCategorySlug}`} onApplyFilter={handlePriceFilterChange} />
                        </div>

                        <div className={`${styles.sidebarSection} ${styles.colorFilter}`}>
                            
                            <ColorFilter
                                key={`color-${subCategorySlug}`}
                                availableColors={availableColors}
                                onChange={handleColorFilterChange}
                            />
                        </div>
                    </aside>

                    {/* --- CỘT PHẢI (MAIN CONTENT) --- */}
                    <main className={styles.mainContent}>
                        {/* Top Bar: Count & Sort */}
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

                        {/* Product Grid */}
                        {sortedProducts.length > 0 ? (
                            <div className={styles.productGrid}>
                                {sortedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noResults}>
                                <p>Không tìm thấy sản phẩm nào phù hợp tiêu chí lọc.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </PageLayout>
    );
};

export default CollectionPage;