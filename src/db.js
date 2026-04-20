import Dexie from "dexie";

export const db = new Dexie("ExcelDB");

db.version(1).stores({
  rows: "++id, name, age",
});

// 🔹 get
export async function getRows() {
  return await db.rows.toArray();
}

// 🔹 add
export async function addRow(row) {
  const id = await db.rows.add(row);
  return { id, ...row };
}

// 🔹 update (ده المهم)
export async function updateRow(id, data) {
  await db.rows.update(id, data);
}