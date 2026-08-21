import { getD1 } from "../../../db";

const schema=`CREATE TABLE IF NOT EXISTS import_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  imported_count INTEGER NOT NULL,
  products TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
)`;

async function ready(){const db=getD1();await db.prepare(schema).run();return db}
const map=(row:Record<string,unknown>)=>({id:Number(row.id),fileName:String(row.file_name),importedCount:Number(row.imported_count),products:JSON.parse(String(row.products||"[]")),createdAt:String(row.created_at)});

export async function GET(){const db=await ready();const {results}=await db.prepare("SELECT * FROM import_logs ORDER BY created_at DESC LIMIT 20").all();return Response.json({logs:results.map(row=>map(row as Record<string,unknown>))})}

export async function POST(request:Request){const payload=await request.json() as {fileName?:string;importedCount?:number;products?:string[]};const db=await ready(),createdAt=new Date().toISOString();const result=await db.prepare("INSERT INTO import_logs (file_name,imported_count,products,created_at) VALUES (?,?,?,?)").bind(payload.fileName||"Excel dosyası",Number(payload.importedCount)||0,JSON.stringify(payload.products||[]),createdAt).run();const row=await db.prepare("SELECT * FROM import_logs WHERE id=?").bind(result.meta.last_row_id).first();return Response.json({log:map(row as Record<string,unknown>)},{status:201})}
