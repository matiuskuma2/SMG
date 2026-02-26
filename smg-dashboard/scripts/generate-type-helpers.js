#!/usr/bin/env node
/**
 * Supabase型定義ファイルに、テーブルと関数のヘルパー型を自動生成して追加するスクリプト
 * 
 * このスクリプトは以下を実行します:
 * 1. ローカルのSupabaseデータベースに接続してテーブルと関数の一覧を取得
 * 2. Supabase型定義ファイルから実際に定義されている関数を抽出
 * 3. 各テーブルに対してRow/Insert/Update型のヘルパーを生成
 * 4. 各関数に対してArgs/ReturnType型のヘルパーを生成
 * 5. 生成したヘルパー型を types.ts に追加
 * 
 * 生成例:
 *   export type MstUser = Tables<'mst_user'>;
 *   export type InsertMstUser = TablesInsert<'mst_user'>;
 *   export type UpdateMstUser = TablesUpdate<'mst_user'>;
 * 
 * 使い方:
 *   pnpm gen:types
 *   または
 *   pnpm gen:supabase && node scripts/generate-type-helpers.js
 * 
 * 前提条件:
 *   - ローカルSupabaseが起動していること (supabase start)
 *   - psqlコマンドが使用可能であること
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TYPES_FILE_PATH = path.join(__dirname, '../src/lib/supabase/types.ts');
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// データベースから直接テーブル名と関数名を取得
function loadDatabaseSchema() {
  const schema = {
    graphql_public: { functions: [] },
    public: { tables: [], functions: [] }
  };

  try {
    // publicスキーマのテーブル一覧を取得
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const tablesResult = execSync(
      `psql "${DB_URL}" -t -c "${tablesQuery}"`,
      { encoding: 'utf-8' }
    );
    schema.public.tables = tablesResult
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // publicスキーマの関数一覧を取得
    const functionsQuery = `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `;
    const functionsResult = execSync(
      `psql "${DB_URL}" -t -c "${functionsQuery}"`,
      { encoding: 'utf-8' }
    );
    schema.public.functions = functionsResult
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // graphql_publicスキーマの関数一覧を取得
    const graphqlFunctionsQuery = `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'graphql_public' 
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `;
    const graphqlFunctionsResult = execSync(
      `psql "${DB_URL}" -t -c "${graphqlFunctionsQuery}"`,
      { encoding: 'utf-8' }
    );
    schema.graphql_public.functions = graphqlFunctionsResult
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

  } catch (error) {
    console.error('❌ データベース接続エラー:', error.message);
    process.exit(1);
  }

  return schema;
}

// 型定義ファイルを読み込む
const typesContent = fs.readFileSync(TYPES_FILE_PATH, 'utf-8');

// PascalCaseに変換
function toPascalCase(str) {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Supabase型定義に存在する関数名を抽出
function getExistingFunctions(content) {
  const existing = {
    graphql_public: [],
    public: []
  };

  // graphql_public Functions（存在する場合）
  const graphqlMatch = content.match(/graphql_public:\s*\{[\s\S]*?Functions:\s*\{([\s\S]*?)\n\s*\}/);
  if (graphqlMatch) {
    const functionsBlock = graphqlMatch[1];
    // 関数名を抽出（行頭からの関数定義のみ、Argsなどのプロパティは除外）
    const matches = functionsBlock.match(/^\s+(\w+):\s*\{/gm);
    if (matches) {
      existing.graphql_public = matches.map(m => {
        const name = m.match(/^\s+(\w+):/)[1];
        return name;
      }).filter(name => name !== 'Args' && name !== 'Returns');
    }
  }

  // public Functions
  const publicMatch = content.match(/public:\s*\{[\s\S]*?Functions:\s*\{([\s\S]*?)\n\s*\}\n\s*Enums:/);
  if (publicMatch) {
    const functionsBlock = publicMatch[1];
    // 関数名を抽出（スペース+関数名: { の形式）
    // Args や Returns プロパティは除外
    const lines = functionsBlock.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s+([a-z_][a-z0-9_]*):\s*\{/);
      if (match && match[1] !== 'Args' && match[1] !== 'Returns') {
        existing.public.push(match[1]);
      }
    }
  }

  return existing;
}

// ヘルパー型定義を生成
function generateHelpers(schema, existingFunctions) {
  let helpers = '';

  // graphql_publicスキーマの関数ヘルパー (Supabase型定義に存在するもののみ)
  const graphqlFunctions = schema.graphql_public?.functions?.filter(
    f => existingFunctions.graphql_public.includes(f)
  ) || [];
  
  if (graphqlFunctions.length > 0) {
    helpers += '// Schema: graphql_public\n';
    helpers += '// Functions\n';
    for (const funcName of graphqlFunctions) {
      const pascalName = toPascalCase(funcName);
      helpers += `export type Args${pascalName} =\n`;
      helpers += `  Database['graphql_public']['Functions']['${funcName}']['Args'];\n`;
      helpers += `export type ReturnType${pascalName} =\n`;
      helpers += `  Database['graphql_public']['Functions']['${funcName}']['Returns'];\n\n`;
    }
  }

  // publicスキーマのテーブルヘルパー
  if (schema.public?.tables?.length > 0) {
    helpers += '// Schema: public\n';
    helpers += '// Tables\n';
    for (const tableName of schema.public.tables) {
      const pascalName = toPascalCase(tableName);
      helpers += `export type ${pascalName} = Tables<'${tableName}'>;\n`;
      helpers += `export type Insert${pascalName} = TablesInsert<'${tableName}'>;\n`;
      helpers += `export type Update${pascalName} = TablesUpdate<'${tableName}'>;\n\n`;
    }
  }

  // publicスキーマの関数ヘルパー (Supabase型定義に存在するもののみ)
  const publicFunctions = schema.public?.functions?.filter(
    f => existingFunctions.public.includes(f)
  ) || [];
  
  if (publicFunctions.length > 0) {
    helpers += '// Functions\n';
    for (const funcName of publicFunctions) {
      const pascalName = toPascalCase(funcName);
      helpers += `export type Args${pascalName} =\n`;
      helpers += `  Database['public']['Functions']['${funcName}']['Args'];\n`;
      helpers += `export type ReturnType${pascalName} =\n`;
      helpers += `  Database['public']['Functions']['${funcName}']['Returns'];\n\n`;
    }
  }

  return helpers.trimEnd();
}

// メイン処理
function main() {
  console.log('📝 型ヘルパーを生成中...');
  console.log('🔌 データベースに接続中...');

  // スキーマ情報を取得
  const schema = loadDatabaseSchema();

  console.log(
    `✓ graphql_public関数: ${schema.graphql_public?.functions?.length || 0}件`
  );
  console.log(`✓ publicテーブル: ${schema.public?.tables?.length || 0}件`);
  console.log(`✓ public関数: ${schema.public?.functions?.length || 0}件`);

  // Supabase型定義に存在する関数を抽出
  const existingFunctions = getExistingFunctions(typesContent);
  console.log(`✓ Supabase型定義の関数: graphql_public=${existingFunctions.graphql_public.length}件, public=${existingFunctions.public.length}件`);

  // ヘルパー型定義を生成
  const helpers = generateHelpers(schema, existingFunctions);

  // 既存のヘルパー型定義を削除して新しいものに置き換え
  // Constants定義の後から、ファイル末尾までを置き換え
  const constantsIndex = typesContent.indexOf('export const Constants = {');
  if (constantsIndex === -1) {
    console.error('❌ Constants定義が見つかりません');
    console.error('⚠️  先に `pnpm gen:supabase` を実行してください');
    process.exit(1);
  }

  // Constants定義の終わりを見つける（複数行にまたがる可能性を考慮）
  const afterConstants = typesContent.slice(constantsIndex);
  const constantsEndMatch = afterConstants.match(/} as const[;\s]*/);
  if (!constantsEndMatch) {
    console.error('❌ Constants定義の終わりが見つかりません');
    console.error('⚠️  types.tsの形式が想定と異なります');
    process.exit(1);
  }

  const constantsEnd = constantsIndex + constantsEndMatch.index + constantsEndMatch[0].length;

  // 既存のヘルパー型を削除（もしあれば）
  let baseContent = typesContent.slice(0, constantsEnd);
  
  // ヘルパー型のセクションを探す
  const helperStart = baseContent.lastIndexOf('// Schema: graphql_public');
  if (helperStart !== -1 && helperStart > constantsEnd - 1000) {
    // 既存のヘルパー型があれば削除
    baseContent = baseContent.slice(0, helperStart);
  }

  // 新しい内容を構築
  const newContent = baseContent.trimEnd() + '\n\n' + helpers + '\n';

  // ファイルに書き込み
  fs.writeFileSync(TYPES_FILE_PATH, newContent, 'utf-8');

  console.log('✅ 型ヘルパーの生成が完了しました');
  console.log(`📄 ${TYPES_FILE_PATH}`);
}

main();
