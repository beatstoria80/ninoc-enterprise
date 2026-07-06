// Shop Mobile Components & Filter Systems
// Native mobile app-style components and modern e-commerce filtering for shop page

export { default as CategoryGrid, NativeMobileProductCard, HorizontalProductScroll, SwipeIndicators } from './NativeMobileShop';
export { 
  useShopFilters, 
  DesktopShopFilterBar, 
  MobileShopFilterBar, 
  matchesCategoryPillar, 
  getCategoryDisplayName, 
  getSubCategory, 
  matchesSize,
  type ShopProduct,
  type FilterSystemType 
} from './ShopFilterSystem';