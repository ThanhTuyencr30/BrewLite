INSERT INTO "toppings" ("name", "slug", "price", "stock", "isAvailable", "createdAt", "updatedAt")
VALUES
    ('Trân châu đen', 'tran-chau-den', 5000, 120, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Trân châu trắng', 'tran-chau-trang', 5000, 100, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Trân châu hoàng kim', 'tran-chau-hoang-kim', 5000, 90, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Thạch củ năng', 'thach-cu-nang', 5000, 80, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Thạch phô mai', 'thach-pho-mai', 5000, 90, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Thạch rau câu', 'thach-rau-cau', 5000, 90, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Flan', 'flan', 5000, 75, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Pudding', 'pudding', 5000, 75, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Kem cheese', 'kem-cheese', 5000, 70, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

UPDATE "toppings"
SET "isAvailable" = TRUE,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN (
    'tran-chau-den',
    'tran-chau-trang',
    'tran-chau-hoang-kim',
    'thach-cu-nang',
    'thach-pho-mai',
    'thach-rau-cau',
    'flan',
    'pudding',
    'kem-cheese'
)
  AND "stock" > 0;

INSERT INTO "product_toppings" ("productId", "toppingId")
SELECT product."id", topping."id"
FROM "products" AS product
CROSS JOIN "toppings" AS topping
WHERE topping."isAvailable" = TRUE
  AND topping."stock" > 0
ON CONFLICT ("productId", "toppingId") DO NOTHING;
