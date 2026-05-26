import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.resolve(".env.local");
  const env = {};
  if (!fs.existsSync(envPath)) return env;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function must(value, name) {
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

const env = loadEnv();
const supabaseUrl = must(env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = must(env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const userPassword = must(env.DEMO_USER_PASSWORD, "DEMO_USER_PASSWORD");
const adminPassword = must(env.DEMO_ADMIN_PASSWORD, "DEMO_ADMIN_PASSWORD");

const demoUsers = [
  { email: "admin@semoduck.test", password: adminPassword, nickname: "세모덕관리자", role: "admin" },
  { email: "user1@semoduck.test", password: userPassword, nickname: "테스트유저1", role: "user" },
  { email: "user2@semoduck.test", password: userPassword, nickname: "테스트유저2", role: "user" },
  { email: "sanrio@semoduck.test", password: userPassword, nickname: "산리오덕후", role: "user" },
  { email: "pokemon@semoduck.test", password: userPassword, nickname: "포켓몬덕후", role: "user" }
];

async function findAuthUser(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) break;
  }
  return null;
}

async function upsertDemoUser(user) {
  let authUser = await findAuthUser(user.email);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.nickname }
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.nickname }
    });
    if (error) throw error;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authUser.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role
  });
  if (profileError) throw profileError;

  return user;
}

try {
  for (const user of demoUsers) {
    const created = await upsertDemoUser(user);
    console.log(`${created.email} (${created.role})`);
  }
  console.log("\nDemo login users are ready.");
} catch (error) {
  console.error(error);
  process.exit(1);
}
