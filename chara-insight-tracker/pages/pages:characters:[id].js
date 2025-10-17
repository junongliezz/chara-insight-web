// pages/characters/[id].js (キャラクター詳細ページ)
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Chart.jsのコンポーネネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// ⚠️ Vercelデプロイ時、このファイルは削除されるため、環境変数を使用します。
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);


const CharacterDetail = ({ character, trendData }) => {
  if (!character) return <div className="p-8">キャラクターが見つかりません。</div>;
  
  // グラフ描画用のデータ整形
  const chartData = {
    labels: trendData.map(d => d.date),
    datasets: [
      {
        label: 'Googleトレンド指数',
        data: trendData.map(d => d.google_index),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        yAxisID: 'yGoogle',
      },
      {
        label: 'X (Twitter) 投稿数',
        data: trendData.map(d => d.x_post_count),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'yX',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    stacked: false,
    scales: {
      yGoogle: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Googleトレンド指数 (0-100)',
        },
        min: 0,
        max: 100, // Googleトレンドの最大値に合わせる
      },
      yX: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'X (Twitter) 投稿数',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>{character.name_jp} - CHARA INSIGHT</title>
      </Head>

      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition-colors">
            ← ダッシュボードに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{character.name_jp}</h1>
          <p className="text-xl text-indigo-600 mb-6">{character.work_jp}</p>

          <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">人気トレンド推移 (時系列)</h2>
          <div className="h-96 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </main>
    </div>
  );
};

// サーバーサイドで初期データを取得
export async function getServerSideProps(context) {
  const { id } = context.params;

  // 1. キャラクター情報を取得
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  // 2. トレンドデータを取得 (過去30日分)
  const { data: trendData } = await supabase
    .from('trend_data')
    .select('*')
    .eq('character_id', id)
    .order('date', { ascending: true })
    .limit(30);

  return {
    props: {
      character: character || null,
      trendData: trendData || [],
    },
  };
}

export default CharacterDetail;