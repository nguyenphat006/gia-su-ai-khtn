import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Target, CheckCircle2, Sparkles, Zap, Star } from 'lucide-react';
import { AppStudentView } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

interface Challenge {
  id: string;
  key: string;
  name: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  goal: number;
  progress: number;
  isCompleted: boolean;
  type: string;
}

interface GamificationFeatureProps {
  studentData: AppStudentView | null;
}

export default function GamificationFeature({ studentData }: GamificationFeatureProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const challengesData = await apiClient<Challenge[]>('/api/gamification/challenges');
        setChallenges(challengesData);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu gamification:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const streak = studentData?.streak || 0;

  const getChallengeIcon = (key: string) => {
    switch (key) {
      case 'S_GIA_CAU_HOI': return <Sparkles size={18} />;
      case 'CHIEN_BINH_TRI_TUE': return <Target size={18} />;
      case 'CHIEN_BINH_DA_TAI': return <Zap size={18} />;
      default: return <Star size={18} />;
    }
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
      {/* Stats Header - Only Streak */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-6 text-white shadow-lg shadow-orange-200">
        <div className="flex items-center gap-3 mb-2">
          <Flame size={20} className="fill-white" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Chuỗi học tập</p>
        </div>
        <h3 className="text-2xl font-black">{streak} ngày liên tiếp</h3>
        <p className="text-[10px] opacity-80 mt-1 font-medium">Duy trì việc học mỗi ngày để thăng hạng!</p>
      </div>

      {/* Daily Challenges */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Target size={20} className="text-sky-600" />
          <h3 className="font-bold text-sky-900 text-sm uppercase tracking-tight">Thử thách hôm nay</h3>
        </div>
        
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id}
                className={`p-4 rounded-2xl border transition-all ${
                  challenge.isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-75' : 'bg-slate-50 border-slate-100 hover:border-sky-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${challenge.isCompleted ? 'bg-emerald-600 text-white' : 'bg-white text-sky-600 border border-sky-50'}`}>
                    {challenge.isCompleted ? <CheckCircle2 size={18} /> : getChallengeIcon(challenge.key)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${challenge.isCompleted ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                        {challenge.name}
                      </h4>
                      <span className="text-[10px] font-black text-sky-600">+{challenge.xpReward} EXP</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{challenge.description}</p>
                    {!challenge.isCompleted && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[9px] font-bold mb-1">
                          <span>Tiến độ</span>
                          <span>{challenge.progress}/{challenge.goal}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(challenge.progress / challenge.goal) * 100}%` }}
                            className="h-full bg-sky-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {challenges.length === 0 && (
              <p className="text-center text-[11px] text-slate-400 py-4 italic">Không có thử thách nào hiện tại.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
