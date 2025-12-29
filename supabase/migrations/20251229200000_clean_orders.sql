-- Migration to delete all orders data
-- This is a destructive operation for order data

-- First unlink active orders from tables to avoid foreign key constraints
UPDATE public.restaurant_tables SET current_order_id = NULL;

-- Delete from dependent tables
DELETE FROM public.feedback;
DELETE FROM public.payments;
DELETE FROM public.order_items;

-- Delete from main orders table
DELETE FROM public.orders;
