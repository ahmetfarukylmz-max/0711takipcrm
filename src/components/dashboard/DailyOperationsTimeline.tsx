import React, { memo, useState } from 'react';
import { formatDate } from '../../utils/formatters';
import type { TodayTask } from '../../types'; // Assuming TodayTask is defined in types or a similar file
import { WhatsAppIcon } from '../icons'; // Assuming WhatsAppIcon is available

interface DailyOperationsTimelineProps {
  todayTasks: TodayTask[];
  onToggleTask: (task: TodayTask) => void;
  setActivePage: (page: string) => void;
  // Add other necessary callbacks or data for quick actions
}

const DailyOperationsTimeline: React.FC<DailyOperationsTimelineProps> = memo(
  ({ todayTasks, onToggleTask, setActivePage }) => {
    return (
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="bg-indigo-50 text-indigo-600 p-2 rounded-lg mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </span>
            Günlük Operasyon Akışı
          </h2>
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
            Bugün
          </span>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>

          <div className="space-y-8">
            {todayTasks.length > 0 ? (
              todayTasks.map((task, index) => {
                const isCompleted = task.completed;
                const isActive =
                  !isCompleted &&
                  new Date().toDateString() === new Date().toDateString() && // Check if today and not completed
                  task.time &&
                  new Date().getHours() * 60 + new Date().getMinutes() >=
                    parseInt(task.time.split(':')[0]) * 60 + parseInt(task.time.split(':')[1]); // Check if current time is past task time

                let dotClasses =
                  'w-8 h-8 rounded-full border-2 border-white flex items-center justify-center z-10 group-hover:scale-110 transition-transform';
                let contentClasses =
                  'bg-gray-50 rounded-xl p-4 hover:bg-white hover:shadow-md hover:border-gray-100 border border-transparent transition-all';
                let statusBadge = null;
                let dotIcon = null;

                if (isCompleted) {
                  dotClasses += ' bg-green-100 text-green-600';
                  contentClasses =
                    'bg-gray-50 rounded-xl p-4 border border-transparent transition-all opacity-60';
                  statusBadge = (
                    <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-0.5 rounded">
                      Tamamlandı
                    </div>
                  );
                  dotIcon = (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  );
                } else if (isActive) {
                  dotClasses += ' bg-blue-600 text-white shadow-md animate-pulse';
                  contentClasses =
                    'bg-white rounded-xl p-4 shadow-md border border-blue-100 ring-2 ring-blue-50';
                  dotIcon = (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  ); // Clock icon
                } else {
                  dotClasses += ' bg-white border-gray-300 text-gray-400';
                  dotIcon = (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  ); // Default clock icon
                }

                return (
                  <div key={task.id} className="relative pl-12 group">
                    {/* Icon/Dot */}
                    <div className={`absolute left-0 top-1 ${dotClasses}`}>{dotIcon}</div>

                    {/* Content */}
                    <div className={contentClasses}>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900">{task.title}</h4>
                        {task.time && (
                          <span className="text-xs font-mono text-gray-400">{task.time}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.subtitle}</p>
                      {statusBadge} {/* Completed badge */}
                      {/* Quick Actions for active/pending tasks */}
                      {!isCompleted && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {task.type === 'meeting' && (
                            <button
                              onClick={() => {
                                /* Implement WhatsApp action */
                              }}
                              className="flex items-center justify-center px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <WhatsAppIcon className="w-3 h-3 mr-1.5" />
                              WhatsApp'tan Yaz
                            </button>
                          )}
                          <button
                            onClick={() => onToggleTask(task)}
                            className={`flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                          >
                            <svg
                              className="w-3 h-3 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                            Tamamla
                          </button>
                          <button
                            onClick={() => {
                              /* Implement View Detail action */
                            }}
                            className="flex items-center justify-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <svg
                              className="w-3 h-3 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                              <path
                                strokeLinecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              ></path>
                            </svg>
                            Detay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bugün için planlanmış bir akış yok.
              </div>
            )}
          </div>

          <button className="w-full mt-6 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center border-t border-dashed border-gray-200">
            + Yeni Görev Ekle
          </button>
        </div>
      </div>
    );
  }
);

DailyOperationsTimeline.displayName = 'DailyOperationsTimeline';

export default DailyOperationsTimeline;
