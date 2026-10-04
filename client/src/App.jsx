import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/SiteLayout';
import AdminLayout from './components/AdminLayout';
import { ProtectedRoute } from './components/Common';
import HomePage from './pages/HomePage';
import { ProductsPage, ProductDetailPage } from './pages/CatalogPages';
import { CartPage, WishlistPage, CheckoutPage, PaymentPage, OrderConfirmationPage, OrderTrackingPage, OrdersPage } from './pages/CommercePages';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage, AddressesPage } from './pages/AccountPages';
import { AboutPage, QualityPage, DeliveryPage, OffersPage, ReviewsPage, ContactPage, NotFoundPage } from './pages/InfoPages';
import { AdminLoginPage, AdminDashboardPage, AdminProductsPage, AdminProductFormPage, AdminInventoryPage, AdminOrdersPage, AdminCustomersPage, AdminReviewsPage, AdminMessagesPage, AdminPromotionsPage, AdminAnalyticsPage, AdminSettingsPage } from './pages/AdminPages';

export default function App() {
  return <Routes>
    <Route element={<SiteLayout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="quality" element={<QualityPage />} />
      <Route path="delivery" element={<DeliveryPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="products/:id" element={<ProductDetailPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="wishlist" element={<WishlistPage />} />
      <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="payment/:id" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
      <Route path="order-confirmation/:id" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
      <Route path="track/:id" element={<ProtectedRoute><OrderTrackingPage /></ProtectedRoute>} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
      <Route path="reviews" element={<ReviewsPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="offers" element={<OffersPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
      <Route index element={<AdminDashboardPage />} />
      <Route path="products" element={<AdminProductsPage />} />
      <Route path="products/new" element={<AdminProductFormPage />} />
      <Route path="products/:id/edit" element={<AdminProductFormPage />} />
      <Route path="inventory" element={<AdminInventoryPage />} />
      <Route path="orders" element={<AdminOrdersPage />} />
      <Route path="customers" element={<AdminCustomersPage />} />
      <Route path="reviews" element={<AdminReviewsPage />} />
      <Route path="messages" element={<AdminMessagesPage />} />
      <Route path="promotions" element={<AdminPromotionsPage />} />
      <Route path="analytics" element={<AdminAnalyticsPage />} />
      <Route path="settings" element={<AdminSettingsPage />} />
    </Route>
  </Routes>;
}
