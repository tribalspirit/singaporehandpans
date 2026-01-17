import { useState, useMemo } from 'react';
import type { ShopProduct } from '../lib/shopifyClient';
import ProductCard from './ProductCard';
import styles from './ShopProductList.module.scss';

interface ShopProductListProps {
  products: ShopProduct[];
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

export default function ShopProductList({ products }: ShopProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');

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

      return (
        matchesSearch && matchesCategory && matchesPrice && matchesAvailability
      );
    });
  }, [products, searchTerm, categoryFilter, priceFilter, availabilityFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setPriceFilter('all');
    setAvailabilityFilter('all');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    categoryFilter !== 'all' ||
    priceFilter !== 'all' ||
    availabilityFilter !== 'all';

  return (
    <div className={styles.container}>
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
          {filteredProducts.length}{' '}
          {filteredProducts.length === 1 ? 'product' : 'products'} found
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
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
