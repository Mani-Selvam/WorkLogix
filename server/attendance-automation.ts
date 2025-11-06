import { storage } from "./storage";

export async function processAutoLogout() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const companies = await storage.getAllCompanies();
    let totalAutoLogouts = 0;
    
    for (const company of companies) {
      if (!company.isActive) continue;
      
      const todayLogs = await storage.getAttendanceLogsByCompany(company.id, today);
      
      const workEndTime = company.workEndTime || '18:00';
      const [endHour, endMinute] = workEndTime.split(':').map(Number);
      
      const autoLogoutTime = new Date();
      autoLogoutTime.setHours(endHour + 1, endMinute, 0, 0);
      
      const currentTime = new Date();
      
      if (currentTime < autoLogoutTime) continue;
      
      for (const log of todayLogs) {
        if (log.loginTime && !log.logoutTime) {
          await storage.updateAttendanceLog(log.id, {
            logoutTime: autoLogoutTime,
            autoLogout: true,
            earlyLogoutReason: 'Auto-logout: User forgot to logout',
          });
          
          await storage.updateAttendanceLogout(
            log.userId,
            company.id,
            today,
            autoLogoutTime
          );
          
          totalAutoLogouts++;
        }
      }
    }
    
    await storage.createAutoTask({
      taskName: 'Auto Logout Processing',
      taskType: 'daily',
      status: 'completed',
      details: `Auto-logged out ${totalAutoLogouts} users across ${companies.length} companies`,
    });
    
    console.log(`[Cron] Auto logout completed: ${totalAutoLogouts} users`);
  } catch (error) {
    console.error('[Cron] Auto logout failed:', error);
    await storage.createAutoTask({
      taskName: 'Auto Logout Processing',
      taskType: 'daily',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function processDailyAttendance() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const companies = await storage.getAllCompanies();
    
    for (const company of companies) {
      if (!company.isActive) continue;
      
      const allMembers = await storage.getUsersByCompanyId(company.id);
      const activeMembers = allMembers.filter(u => u.role === 'company_member' && u.isActive);
      
      const todayLogs = await storage.getAttendanceLogsByCompany(company.id, today);
      const attendedUserIds = new Set(todayLogs.map(log => log.userId));
      
      for (const member of activeMembers) {
        if (!attendedUserIds.has(member.id)) {
          await storage.markAbsent(member.id, company.id, today);
        }
      }
      
      for (const member of activeMembers) {
        await updateStreak(member.id, company.id);
      }
    }
    
    await storage.createAutoTask({
      taskName: 'Daily Attendance Processing',
      taskType: 'daily',
      status: 'completed',
      details: `Processed attendance for ${companies.length} companies`,
    });
    
    console.log(`[Cron] Daily attendance processing completed for ${companies.length} companies`);
  } catch (error) {
    console.error('[Cron] Daily attendance processing failed:', error);
    await storage.createAutoTask({
      taskName: 'Daily Attendance Processing',
      taskType: 'daily',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function updateStreak(userId: number, companyId: number) {
  const reward = await storage.getOrCreateAttendanceReward(userId, companyId);
  const today = new Date().toISOString().split('T')[0];
  const todayLog = await storage.getAttendanceLog(userId, companyId, today);
  
  if (!todayLog) return;
  
  const lastAttendanceDate = reward.lastAttendanceDate;
  let newStreak = reward.currentStreak;
  
  const attendedStatuses = ['on-time', 'present', 'slightly-late', 'late', 'very-late'];
  const isAttended = attendedStatuses.includes(todayLog.status);
  
  if (isAttended) {
    if (lastAttendanceDate) {
      const lastDate = new Date(lastAttendanceDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = reward.currentStreak + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
    
    const longestStreak = Math.max(newStreak, reward.longestStreak);
    
    await storage.updateAttendanceReward(userId, {
      currentStreak: newStreak,
      longestStreak,
      lastAttendanceDate: today,
    });
    
    if (newStreak === 5) {
      await storage.updateAttendanceReward(userId, {
        totalPoints: reward.totalPoints + 10,
      });
    }
    
    if (newStreak === 10) {
      await storage.assignBadge(userId, 'Early Bird');
    }
    
    if (newStreak === 30) {
      await storage.assignBadge(userId, 'Perfect Month');
    }
    
    if (newStreak === 90) {
      await storage.assignBadge(userId, 'Dedicated Star');
    }
  } else if (todayLog.status === 'absent') {
    await storage.updateAttendanceReward(userId, {
      currentStreak: 0,
      lastAttendanceDate: today,
    });
  }
}

export async function processWeeklySummary() {
  try {
    const companies = await storage.getAllCompanies();
    
    for (const company of companies) {
      if (!company.isActive) continue;
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const logs = await storage.getAttendanceLogsByDateRange(company.id, startDate, endDate);
      const topPerformers = await storage.getTopPerformers(company.id, 5);
      
      console.log(`[Cron] Weekly summary for ${company.name}: ${logs.length} attendance records, ${topPerformers.length} top performers`);
    }
    
    await storage.createAutoTask({
      taskName: 'Weekly Summary',
      taskType: 'weekly',
      status: 'completed',
      details: `Generated weekly summaries for ${companies.length} companies`,
    });
    
    console.log(`[Cron] Weekly summary completed for ${companies.length} companies`);
  } catch (error) {
    console.error('[Cron] Weekly summary failed:', error);
    await storage.createAutoTask({
      taskName: 'Weekly Summary',
      taskType: 'weekly',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function processMonthlyRewards() {
  try {
    const companies = await storage.getAllCompanies();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    for (const company of companies) {
      if (!company.isActive) continue;
      
      const allMembers = await storage.getUsersByCompanyId(company.id);
      const activeMembers = allMembers.filter(u => u.role === 'company_member' && u.isActive);
      
      for (const member of activeMembers) {
        const monthlyReport = await storage.getMonthlyAttendanceReport(member.id, currentMonth, currentYear);
        
        if (monthlyReport.absentDays === 0 && monthlyReport.presentDays === monthlyReport.totalDays) {
          await storage.assignBadge(member.id, 'Perfect Month');
          
          const reward = await storage.getAttendanceRewardByUser(member.id);
          if (reward) {
            await storage.updateAttendanceReward(member.id, {
              perfectMonths: reward.perfectMonths + 1,
              totalPoints: reward.totalPoints + 100,
            });
          }
        }
        
        if (monthlyReport.lateDays === 0 && monthlyReport.absentDays === 0) {
          await storage.assignBadge(member.id, 'Reliable Performer');
        }
        
        await storage.updateAttendanceReward(member.id, {
          monthlyScore: 0,
        });
      }
    }
    
    await storage.createAutoTask({
      taskName: 'Monthly Rewards',
      taskType: 'monthly',
      status: 'completed',
      details: `Processed monthly rewards for ${companies.length} companies`,
    });
    
    console.log(`[Cron] Monthly rewards processing completed for ${companies.length} companies`);
  } catch (error) {
    console.error('[Cron] Monthly rewards processing failed:', error);
    await storage.createAutoTask({
      taskName: 'Monthly Rewards',
      taskType: 'monthly',
      status: 'failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function initializeBadges() {
  try {
    const existingBadges = await storage.getAllBadges();
    if (existingBadges.length > 0) {
      console.log('[Init] Badges already initialized');
      return;
    }
    
    const badgeDefinitions = [
      {
        name: 'Early Bird',
        description: 'Logged in before 9:00 AM for 10+ consecutive days',
        icon: '🌞',
        criteria: '10+ consecutive on-time logins',
        type: 'streak',
      },
      {
        name: 'Perfect Month',
        description: '30 days perfect attendance',
        icon: '🏆',
        criteria: 'No absences in a month',
        type: 'monthly',
      },
      {
        name: 'Reliable Performer',
        description: 'No absences in a month',
        icon: '💼',
        criteria: 'Perfect attendance for one month',
        type: 'monthly',
      },
      {
        name: 'Work Warrior',
        description: 'Highest attendance streak',
        icon: '🔥',
        criteria: 'Longest active streak',
        type: 'streak',
      },
      {
        name: 'Dedicated Star',
        description: 'Maintains 90-day streak',
        icon: '💫',
        criteria: '90+ consecutive days of attendance',
        type: 'streak',
      },
      {
        name: 'Consistent Star',
        description: 'Consistent monthly performer',
        icon: '⭐',
        criteria: 'High monthly scores',
        type: 'monthly',
      },
    ];
    
    for (const badge of badgeDefinitions) {
      await storage.createBadge(badge);
    }
    
    console.log('[Init] Badges initialized successfully');
  } catch (error) {
    console.error('[Init] Badge initialization failed:', error);
  }
}
