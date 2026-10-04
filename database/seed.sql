-- Demo records for Pure Aqua. Password hashes are generated with bcrypt (cost 10).
USE pure_aqua;

INSERT INTO categories (id,name,slug,description) VALUES
(1,'Bottled Water','bottled-water','Freshly sealed water for everyday hydration.'),
(2,'Home & Office','home-office','Convenient larger formats for shared spaces.'),
(3,'Value Packs','value-packs','Better value for families, events and teams.')
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description);

-- These first three products preserve the original Pure Aqua catalogue and prices.
INSERT INTO products (id,category_id,name,slug,size_label,description,image_url,price,discount_price,stock,rating_avg,review_count,enabled) VALUES
(1,1,'500ml Bottle','500ml-bottle','500 ml','Perfect for on-the-go hydration. Small, lightweight, and easy to carry.','/images/product-500ml.svg',10.00,NULL,240,4.80,38,1),
(2,1,'1L Bottle','1l-bottle','1 L','Stay refreshed all day long with our 1L bottle, ideal for daily use.','/images/product-1l.svg',15.00,NULL,180,4.90,52,1),
(3,2,'20L Jar','20l-jar','20 L','Ideal for home and office use. Provides a long-lasting supply of clean water.','/images/product-20l.svg',30.00,NULL,74,4.90,67,1),
(4,1,'2L Family Bottle','2l-family-bottle','2 L','A generous bottle for the table, the road, or sharing a little more refreshment.','/images/product-2l.svg',25.00,22.00,96,4.70,24,1),
(5,3,'1L Bottle Case · 6 Pack','1l-bottle-case-6-pack','6 × 1 L','Six everyday bottles in one convenient pack. A simple way to keep the fridge stocked.','/images/product-case.svg',90.00,84.00,58,4.80,19,1)
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),price=VALUES(price),discount_price=VALUES(discount_price),stock=VALUES(stock);

-- Demo password for both accounts: change immediately in any non-demo installation.
-- These cost-10 bcrypt hashes match the documented fictional demo credentials.
INSERT INTO users (id,name,email,phone,password_hash) VALUES
(1,'Aarav Mehta','customer@pureaqua.demo','+91 98765 43210','$2a$10$G6IzWLAu0KeS.SLwP52hYu/9no4bIEk3Gz.1zDF4D1BqIhbuOVvi.')
ON DUPLICATE KEY UPDATE name=VALUES(name),phone=VALUES(phone);
INSERT INTO admins (id,name,email,password_hash) VALUES
(1,'Pure Aqua Admin','admin@pureaqua.demo','$2a$10$h0qdemNiLDk5nZfrNOziYeRJvPFSEiD0RZOkNxYflWarF4xGkb3f.')
ON DUPLICATE KEY UPDATE name=VALUES(name);

DELETE FROM addresses WHERE user_id=1 AND address_line='14, Lake View Road' AND pincode='411001';
INSERT INTO addresses (user_id,full_name,phone,address_line,city,state,pincode,is_default) VALUES
(1,'Aarav Mehta','+91 98765 43210','14, Lake View Road','Pune','Maharashtra','411001',1);

INSERT INTO orders (id,order_number,user_id,status,payment_status,payment_method,subtotal,discount,delivery_charge,tax,total,address_snapshot,expected_delivery,created_at) VALUES
(81,'PA-2026-00081',1,'DELIVERED','PAID','MOCK',60.00,0.00,0.00,3.00,63.00,'{"fullName":"Aarav Mehta","phone":"+91 98765 43210","addressLine":"14, Lake View Road","city":"Pune","state":"Maharashtra","pincode":"411001","isDefault":true}','2026-09-26 12:00:00','2026-09-24 10:10:00'),
(106,'PA-2026-00106',1,'OUT_FOR_DELIVERY','PAID','MOCK',30.00,0.00,25.00,1.50,56.50,'{"fullName":"Aarav Mehta","phone":"+91 98765 43210","addressLine":"14, Lake View Road","city":"Pune","state":"Maharashtra","pincode":"411001","isDefault":true}','2026-10-04 17:00:00','2026-10-03 08:15:00')
ON DUPLICATE KEY UPDATE status=VALUES(status),payment_status=VALUES(payment_status),total=VALUES(total);
DELETE FROM order_items WHERE order_id IN (81,106);
INSERT INTO order_items (order_id,product_id,product_name,size_label,image_url,unit_price,list_price,quantity) VALUES
(81,3,'20L Jar','20 L','/images/product-20l.svg',30.00,30.00,2),
(106,2,'1L Bottle','1 L','/images/product-1l.svg',15.00,15.00,2);
INSERT INTO payments (order_id,provider,transaction_id,amount,status,metadata) VALUES
(81,'MOCK','DEMO-TXN-PA-81',63.00,'PAID','{"seeded":true}'),
(106,'MOCK','DEMO-TXN-PA-106',56.50,'PAID','{"seeded":true}')
ON DUPLICATE KEY UPDATE status=VALUES(status);

INSERT INTO promotions (code,title,description,discount_type,discount_value,min_order,starts_at,ends_at,is_active,badge) VALUES
('PURE10','A little more for less','Save 10% on your first order over ₹199.','percent',10,199,'2025-01-01 00:00:00','2027-12-31 23:59:59',1,'FIRST ORDER'),
('JAR5','Bulk jar savings','Save ₹5 on home and office orders of 20L jars.','fixed',5,60,'2025-01-01 00:00:00','2027-12-31 23:59:59',1,'BULK OFFER')
ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),discount_value=VALUES(discount_value),is_active=VALUES(is_active);

INSERT INTO reviews (user_id,product_id,rating,title,body,status) VALUES
(1,3,5,'Easy office delivery','The 20L jar arrives on schedule and the ordering process is simple. A dependable everyday service.','APPROVED'),
(1,2,5,'Just right for the day','Good size to keep at my desk and the bottles are always neatly sealed.','APPROVED')
ON DUPLICATE KEY UPDATE status=VALUES(status);

DELETE FROM contact_messages WHERE email='nisha@example.test' AND subject='Delivery area';
INSERT INTO contact_messages (name,email,phone,subject,message,status) VALUES
('Nisha Kulkarni','nisha@example.test','+91 90000 12345','Delivery area','Could you please confirm delivery availability near Aundh?','NEW');

INSERT INTO app_settings (setting_key,setting_value) VALUES
('agencyName','"Pure Aqua"'),('supportEmail','"hello@pureaqua.example"'),('supportPhone','"+91 80000 12345"'),('deliveryFee','25'),('freeDeliveryThreshold','299'),('lowStockThreshold','15'),('address','"Pune, Maharashtra"')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
