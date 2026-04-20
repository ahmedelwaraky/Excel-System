import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ukkwaqrjienaiiuoddwe.supabase.co"; // ← حط URL بتاعك
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVra3dhcXJqaWVuYWlpdW9kZHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjg4NTUsImV4cCI6MjA5MjIwNDg1NX0.Ahb093OKXIYIak1iUslrGND0kLVwGiRw6OrslxZGsMU"; // ← حط الـ anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
