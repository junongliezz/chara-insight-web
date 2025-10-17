// pages/index.js (トップページ)
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// ⚠️ Vercelデプロイ時、このファイルは削除されるため、環境変数を使用します。
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// キャラクターカードコンポーネント
const CharacterCard = ({ char, trend }) => {
  const googleIndex = trend ? trend.google_index : 0;
  
  return (
    <Link href={`/characters/${char.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-4 cursor-pointer">
        <h2 className="text-xl font-bold text-gray-800 truncate">{char.name_jp}</h2>
        <p className="text-sm text-indigo-600 mb-2">{char.work_jp}</p>
        <div className="text-2xl font-extrabold mt-4">
          🔥 {googleIndex} <span className="text-base text-gray-500 font-normal">Googleトレンド指数</span>
        </div>
      </div>
    </Link>
  );
};

export default function Home({ characters, trends }) {
  // トレンドデータとキャラクターデータを結合
  const characterData = characters.map(char => {
    const latestTrend = trends.find(t => t.character_id === char.id);
    return {
      ...char,
      latestTrend: latestTrend,
    };
  }).sort((a, b) => (b.latestTrend?.google_index || 0) - (a.latestTrend?.google_index || 0));

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>CHARA INSIGHT ダッシュボード</title>
      </Head>

      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-3xl font-extrabold text-indigo-700">CHARA INSIGHT</div>
            <span className="ml-3 text-sm text-gray-500">人気トラッカー</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">キャラクター人気ランキング (Googleトレンド)</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characterData.map(char => (
              <CharacterCard key={char.id} char={char} trend={char.latestTrend} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// サーバーサイドでのデータ取得
export async function getServerSideProps() {
  // DBから全キャラクター情報を取得
  const { data: characters } = await supabase.from('characters').select('*');

  // DBから最新の日付のトレンドデータを全て取得 (最新日を特定)
  const { data: latestDateData } = await supabase
    .from('trend_data')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  let trends = [];
  if (latestDateData && latestDateData.length > 0) {
    const latestDate = latestDateData[0].date;
    // 最新の日付に一致する全てのトレンドデータを取得
    const { data: latestTrends } = await supabase
      .from('trend_data')
      .select('*')
      .eq('date', latestDate);
    trends = latestTrends;
  }


  return {
    props: {
      characters: characters || [],
      trends: trends || [],
    },
  };
}