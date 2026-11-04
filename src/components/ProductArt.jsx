export function ProductArt({item, large = false, priority = false, className = ''}) {
  const placeholderLabel = item.placeholderLabel || 'Image coming soon';
  return (
    <div className={`product-art ${large ? 'large' : ''} ${className}`}>
      {item.src ? (
        <img
          src={item.src}
          alt={item.name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          className={item.contain ? 'contain' : ''}
        />
      ) : (
        <div className="product-art-placeholder" role="img" aria-label={`${item.name}: ${placeholderLabel}`}>
          <span>{placeholderLabel}</span>
          <strong>{item.name}</strong>
        </div>
      )}
    </div>
  );
}
