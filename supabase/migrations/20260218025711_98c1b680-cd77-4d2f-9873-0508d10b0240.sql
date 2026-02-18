
-- 1. Criar empresa
INSERT INTO companies (id, name, phone, email, address, cancel_limit_hours, max_advance_days, max_active_appointments)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001', 'BarberFlow Studio', '(11) 99999-0000', 'contato@barberflow.com', 'Rua das Barbearias, 100 - São Paulo', 12, 30, 3);

-- 2. Criar serviços
INSERT INTO services (id, company_id, name, description, duration_minutes, price, active) VALUES
('a1b2c3d4-1111-1111-1111-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Corte Masculino', 'Corte moderno com máquina e tesoura', 30, 45.00, true),
('a1b2c3d4-1111-1111-1111-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Barba', 'Barba completa com navalha e toalha quente', 20, 30.00, true),
('a1b2c3d4-1111-1111-1111-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Corte + Barba', 'Combo corte e barba completa', 50, 65.00, true),
('a1b2c3d4-1111-1111-1111-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Pigmentação', 'Pigmentação capilar profissional', 60, 80.00, true);

-- 3. Criar profissionais
INSERT INTO professionals (id, company_id, name, specialties, active) VALUES
('a1b2c3d4-2222-2222-2222-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Carlos Silva', ARRAY['Corte', 'Barba'], true),
('a1b2c3d4-2222-2222-2222-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Rafael Santos', ARRAY['Corte', 'Pigmentação'], true),
('a1b2c3d4-2222-2222-2222-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Diego Oliveira', ARRAY['Corte', 'Barba', 'Pigmentação'], true);

-- 4. Horários de trabalho
INSERT INTO working_hours (company_id, professional_id, day_of_week, start_time, end_time, is_available) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000001', 1, '09:00', '18:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000001', 2, '09:00', '18:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000001', 3, '09:00', '18:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000001', 4, '09:00', '18:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000001', 5, '09:00', '18:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000001', 6, '09:00', '14:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000002', 1, '10:00', '19:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000002', 2, '10:00', '19:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000002', 3, '10:00', '19:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000002', 4, '10:00', '19:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000002', 5, '10:00', '19:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000003', 1, '08:00', '17:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000003', 2, '08:00', '17:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000003', 3, '08:00', '17:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000003', 4, '08:00', '17:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000003', 5, '08:00', '17:00', true),
('a1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-2222-2222-2222-000000000003', 6, '08:00', '14:00', true);

-- 5. Cliente vinculado ao usuário auth
INSERT INTO clients (id, company_id, user_id, name, phone, email, active)
VALUES ('a1b2c3d4-3333-3333-3333-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'bbcf75fb-5bfa-487f-ad5d-0e6f448290bc', 'Yuri Omlessa', '(11) 98888-0000', 'yuri.omlessa@gmail.com', true);

-- 6. Role client
INSERT INTO user_roles (user_id, role, company_id)
VALUES ('bbcf75fb-5bfa-487f-ad5d-0e6f448290bc', 'client', 'a1b2c3d4-0000-0000-0000-000000000001');

-- 7. Produtos
INSERT INTO products (company_id, name, description, price, stock, duration_days, active) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'Pomada Modeladora', 'Pomada efeito matte 100g', 35.00, 20, 60, true),
('a1b2c3d4-0000-0000-0000-000000000001', 'Óleo para Barba', 'Óleo hidratante 30ml', 45.00, 15, 45, true);
