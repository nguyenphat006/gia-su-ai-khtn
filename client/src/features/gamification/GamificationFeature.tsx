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
    <div className="space-y-3 h-full pb-4">
      {/* Stats Header - Only Streak */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={16} className="fill-white" />
          <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Chuỗi học tập</p>
        </div>
        <h3 className="text-lg font-black">{streak} ngày liên tiếp</h3>
        <p className="text-[9px] opacity-80 mt-0.5 font-medium">Duy trì việc học mỗi ngày nhé!</p>
      </div>

      {/* Daily Challenges */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-sky-600" />
          <h3 className="font-bold text-sky-900 text-xs uppercase tracking-tight">Thử thách hôm nay</h3>
        </div>
        
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <div 
                key={challenge.id}
                className={`p-3 rounded-xl border transition-all ${
                  challenge.isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-75' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${challenge.isCompleted ? 'bg-emerald-600 text-white' : 'bg-white text-sky-600 border border-sky-50'}`}>
                    {challenge.isCompleted ? <CheckCircle2 size={14} /> : getChallengeIcon(challenge.key)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-[11px] font-bold truncate ${challenge.isCompleted ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                        {challenge.name}
                      </h4>
                      <span className="text-[8px] font-black text-sky-600 shrink-0">+{challenge.xpReward}E</span>
                    </div>
                    <p className="text-[8px] text-slate-400 italic leading-tight mt-0.5">{challenge.description}</p>
                    {!challenge.isCompleted && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[7px] font-bold mb-0.5">
                          <span>{challenge.progress}/{challenge.goal}</span>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
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
              <p className="text-center text-[9px] text-slate-400 py-2 italic">Không có thử thách.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
