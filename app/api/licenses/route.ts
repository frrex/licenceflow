import { env } from "cloudflare:workers";

const schema = `CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  start_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  cost REAL NOT NULL,
  currency TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

async function ready() { await env.DB.prepare(schema).run(); return env.DB }
const map = (r: Record<string, unknown>) => ({ id:r.id, productName:r.product_name, vendor:r.vendor, category:r.category, startDate:r.start_date, expirationDate:r.expiration_date, cost:r.cost, currency:r.currency, description:r.description, createdAt:r.created_at, updatedAt:r.updated_at });

export async function GET() {
  const db=await ready(); const {results}=await db.prepare("SELECT * FROM licenses ORDER BY created_at DESC").all();
  return Response.json({licenses:results.map(r=>map(r as Record<string,unknown>))});
}
export async function POST(request:Request) {
  const p=await request.json() as Record<string, string|number>; const now=new Date().toISOString(), db=await ready();
  const result=await db.prepare("INSERT INTO licenses (product_name,vendor,category,start_date,expiration_date,cost,currency,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(p.productName,p.vendor,p.category,p.startDate,p.expirationDate,Number(p.cost),p.currency,p.description||"",now,now).run();
  const row=await db.prepare("SELECT * FROM licenses WHERE id=?").bind(result.meta.last_row_id).first();
  return Response.json({license:map(row as Record<string,unknown>)},{status:201});
}
export async function PUT(request:Request) {
  const p=await request.json() as Record<string,string|number>; const now=new Date().toISOString(),db=await ready();
  await db.prepare("UPDATE licenses SET product_name=?,vendor=?,category=?,start_date=?,expiration_date=?,cost=?,currency=?,description=?,updated_at=? WHERE id=?").bind(p.productName,p.vendor,p.category,p.startDate,p.expirationDate,Number(p.cost),p.currency,p.description||"",now,Number(p.id)).run();
  const row=await db.prepare("SELECT * FROM licenses WHERE id=?").bind(Number(p.id)).first(); return Response.json({license:map(row as Record<string,unknown>)});
}
export async function DELETE(request:Request) { const id=new URL(request.url).searchParams.get("id"); if(!id)return Response.json({error:"id gerekli"},{status:400}); const db=await ready(); await db.prepare("DELETE FROM licenses WHERE id=?").bind(Number(id)).run(); return new Response(null,{status:204}) }
