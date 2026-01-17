import type { ShopProduct } from '../lib/shopifyClient';
import styles from './ProductCard.module.scss';

interface ProductCardProps {
  product: ShopProduct;
}

function formatPrice(price: { amount: number; currencyCode: string }): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: price.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price.amount);
}

function truncateDescription(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    title,
    description,
    image,
    priceMin,
    productType,
    availableForSale,
    shopUrl,
  } = product;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {image ? (
          <img
            src={image.url}
            alt={image.altText || title}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </span>
          </div>
        )}
        {!availableForSale && (
          <span className={styles.soldOutBadge}>Sold Out</span>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.category}>{productType}</span>
        </div>

        <h3 className={styles.title}>{title}</h3>

        {description && (
          <p className={styles.description}>
            {truncateDescription(description)}
          </p>
        )}

        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(priceMin)}</span>

          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.buyButton} ${!availableForSale ? styles.disabled : ''}`}
            aria-label={
              availableForSale
                ? `Buy ${title} - opens Shopify store in new tab`
                : `${title} is sold out`
            }
          >
            {availableForSale ? 'Buy' : 'View'}
          </a>
        </div>
      </div>
    </article>
  );
}
