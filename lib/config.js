export const SITE_NAME = "TDLA";
export const SITE_TAGLINE = "TDLA";
export const SITE_DESCRIPTION = "Private";
export const CATEGORIES = ["All", "Highs", "Mids", "Lows", "Accessories"];
export const SHIPPING_OPTIONS = [
  { id: "free", label: "Free Shipping (UPS 2 Day Air / USPS Priority)", price: 0 },
  { id: "overnight", label: "Overnight Next Day Shipping", price: 50 },
];
export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash in Mail", fee: 0 },
  { id: "crypto", label: "Crypto (USDT or BTC)", fee: 0 },
  { id: "cashapp", label: "CashApp", fee: 0 },
  { id: "zelle", label: "Zelle", fee: 0 },
];
export const ADMIN_PASSWORD = "changeme123";
export const fmt = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const genOrderNum = () => "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
export const todayStr = () => { const d = new Date(); return String(d.getMonth()+1).padStart(2,"0") + "/" + String(d.getDate()).padStart(2,"0") + "/" + d.getFullYear(); };

// Bulk discount rules: 5+ = $50 off, 10+ = $100 off (higher tier replaces lower)
export const BULK_DISCOUNTS = [
  { minItems: 5, discount: 50, label: "5+ items: $50 off each" },
  { minItems: 10, discount: 100, label: "10+ items: $100 off each" }
];

export const PRODUCT_FIELDS = [
  { key: "description", label: "Description", type: "textarea" },
  { key: "smellRating", label: "Smell Rating", type: "select", options: ["1", "2", "3", "4", "5"] },
  { key: "strain", label: "Strain Type", type: "select", options: ["Indica", "Sativa", "Hybrid"] },
  { key: "weight", label: "Weight/Qty", type: "text" },
  { key: "badge", label: "Badge", type: "select", options: ["", "HOT", "NEW", "SALE", "TOP", "LIMITED"] },
  { key: "dateAdded", label: "Date Added", type: "date", subtext: "Visible to customers on storefront" },
  { key: "dateUpdated", label: "Date Updated", type: "date", subtext: "Visible to customers on storefront" },
];
