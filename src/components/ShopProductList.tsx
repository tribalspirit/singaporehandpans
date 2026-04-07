import { useState, useMemo, useEffect, useRef } from 'react';
import type { ShopProduct, ShopCollection } from '../lib/shopifyClient';
import ProductCard from './ProductCard';
import styles from './ShopProductList.module.scss';

interface ShopProductListProps {
  products: ShopProduct[];
  collections?: ShopCollection[];
  collectionProductMap?: Record<string, string[]>;
  pageSize?: number;
}

type AvailabilityFilter = 'all' | 'in-stock' | 'out-of-stock';
type PriceFilter = 'all' | 'under-500' | '500-1500' | 'above-1500';

const PRICE_BUCKETS: { value: PriceFilter; label: string }[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'under-500', label: 'Under S$500' },
  { value: '500-1500', label: 'S$500 - S$1,500' },
  { value: 'above-1500', label: 'Above S$1,500' },
];

const AVAILABILITY_OPTIONS: { value: AvailabilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

function matchesPriceBucket(price: number, bucket: PriceFilter): boolean {
  switch (bucket) {
    case 'under-500':
      return price < 500;
    case '500-1500':
      return price >= 500 && price <= 1500;
    case 'above-1500':
      return price > 1500;
    default:
      return true;
  }
}

export default function ShopProductList({
  products,
  collections,
  collectionProductMap,
  pageSize = 12,
}: ShopProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map((p) => p.productType));
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesCategory =
        categoryFilter === 'all' || product.productType === categoryFilter;

      const matchesPrice = matchesPriceBucket(
        product.priceMin.amount,
        priceFilter
      );

      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'in-stock' && product.availableForSale) ||
        (availabilityFilter === 'out-of-stock' && !product.availableForSale);

      const matchesCollection =
        collectionFilter === 'all' ||
        (collectionProductMap?.[collectionFilter]?.includes(product.id) ??
          false);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesAvailability &&
        matchesCollection
      );
    });
  }, [
    products,
    searchTerm,
    categoryFilter,
    priceFilter,
    availabilityFilter,
    collectionFilter,
    collectionProductMap,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, filteredProducts.length);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    categoryFilter,
    priceFilter,
    availabilityFilter,
    collectionFilter,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPriceFilter('all');
    setAvailabilityFilter('all');
    setCollectionFilter('all');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    categoryFilter !== 'all' ||
    priceFilter !== 'all' ||
    availabilityFilter !== 'all' ||
    collectionFilter !== 'all';

  const showCollectionFilter = collections && collections.length > 0;

  return (
    <div className={styles.container} ref={gridRef}>
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <label htmlFor="product-search" className={styles.srOnly}>
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <div className={styles.dropdowns}>
          {showCollectionFilter && (
            <div className={styles.selectWrapper}>
              <label htmlFor="collection-filter" className={styles.srOnly}>
                Filter by brand
              </label>
              <select
                id="collection-filter"
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Brands</option>
                {collections.map((col) => (
                  <option key={col.handle} value={col.handle}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.selectWrapper}>
            <label htmlFor="category-filter" className={styles.srOnly}>
              Filter by category
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.select}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <label htmlFor="price-filter" className={styles.srOnly}>
              Filter by price
            </label>
            <select
              id="price-filter"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
              className={styles.select}
            >
              {PRICE_BUCKETS.map((bucket) => (
                <option key={bucket.value} value={bucket.value}>
                  {bucket.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectWrapper}>
            <label htmlFor="availability-filter" className={styles.srOnly}>
              Filter by availability
            </label>
            <select
              id="availability-filter"
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(e.target.value as AvailabilityFilter)
              }
              className={styles.select}
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className={styles.clearButton}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className={styles.resultsInfo}>
        <span>
          {filteredProducts.length === 0
            ? '0 products found'
            : totalPages > 1
              ? `Showing ${rangeStart}\u2013${rangeEnd} of ${filteredProducts.length} products`
              : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'products'} found`}
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products found. Try adjusting your filters.</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className={styles.resetButton}
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Product pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={styles.pageButton}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={styles.pageButton}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
