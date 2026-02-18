import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AdminLayout } from './admin/AdminLayout';
import { DashboardOverview } from './admin/DashboardOverview';
import { QuickActionsPage } from './admin/QuickActionsPage';
import { ResultCalculationPage } from './admin/ResultCalculationPage';
import { ExportResultsPage } from './admin/ExportResultsPage';
import { AdminDashboard } from './admin/AdminDashboard';
import { EventsList } from './admin/EventsList';
import { ResultsView } from './admin/ResultsView';
import { TeamsManagement } from './admin/TeamsManagement';
import { JudgesManagement } from './admin/JudgesManagement';
import { TeamAllocation } from './admin/TeamAllocation';
import { AllocationView } from './admin/AllocationView';
import { LiveUpdatesView } from './admin/LiveUpdatesView';
import { JudgeDashboard } from './judge/JudgeDashboard';
import { ScoringInterface } from './judge/ScoringInterface';
import { LoginPage } from './auth/LoginPage';
import { Layout } from './shared/Layout';
import { User, Event, Team, Score, Judge, RoundType } from '../types';
import {
  mockEvents as initialEvents,
  mockTeams as initialTeams,
  mockScores as initialScores,
  mockJudges
} from '../utils/mockData';
import {
  listDomains,
  listTeams,
  listJudges,
  listAllocations,
  listScores,
  listMyScores,
  listMyRoundTwoScores,
  listRoundTwoTeamsScores,
  listRoundTwoAllocations,
  listMyAllocations,
  setDomainJudges,
  submitScore,
  submitRoundTwoScore
} from '../api/scoringApi';

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [scores, setScores] = useState<Score[]>(initialScores);
  const [judges, setJudges] = useState<Judge[]>(mockJudges);

  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem('current_user');
      }
    }
  }, []);

  // Handle login
  const handleLogin = (user: User) => {
    console.log('🔐 User logged in:', { userId: user.id, role: user.role });
    setCurrentUser(user);
    localStorage.setItem('current_user', JSON.stringify(user));
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/judge');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
    navigate('/');
  };

  const domainKeyToName = useMemo(() => {
    const map = new Map([
      ['fintech_ecommerce', 'Fintech and E-commerce'],
      ['health_biotech', 'Health and BioTech'],
      ['agritech_rural', 'Agri-Tech & Rural Empowerment'],
      ['sustainable_smart_cities', 'Sustainable solutions and smart cities'],
      ['skills_edtech', 'Skills and Edtech']
    ]);
    return map;
  }, []);

  const domainNameToKey = useMemo(() => {
    const map = new Map([
      ['Fintech and E-commerce', 'fintech_ecommerce'],
      ['Health and BioTech', 'health_biotech'],
      ['Agri-Tech & Rural Empowerment', 'agritech_rural'],
      ['Sustainable solutions and smart cities', 'sustainable_smart_cities'],
      ['Skills and Edtech', 'skills_edtech']
    ]);
    return map;
  }, []);


  const mapScoreToPayload = (eventId: string, scoreData: Omit<Score, 'id' | 'submittedAt'>) => {
    const event = events.find(e => e.id === eventId);
    const criteria = event?.scoringCriteria || [];

    const byName = (name: string) =>
      criteria.find(c => c.name.toLowerCase().includes(name))?.id;

    const getScore = (id?: string) => (id ? scoreData.scores[id] || 0 : 0);

    return {
      problemIdentification: getScore(byName('problem')),
      innovationCreativity: getScore(byName('innovation')),
      feasibilityPracticality: getScore(byName('feasibility')),
      marketImpactPotential: getScore(byName('market')),
      technologyDomainRelevance: getScore(byName('technology')),
      pitchDeliveryQA: getScore(byName('pitch')),
      bonus: scoreData.bonusScore || 0
    };
  };

  const mapApiScoreToCriteria = (eventId: string, score: any) => {
    const event = events.find(e => e.id === eventId);
    const criteria = event?.scoringCriteria || [];
    const result: Record<string, number> = {};

    criteria.forEach(c => {
      const name = c.name.toLowerCase();
      if (name.includes('problem')) result[c.id] = score.problemIdentification || 0;
      else if (name.includes('innovation')) result[c.id] = score.innovationCreativity || 0;
      else if (name.includes('feasibility')) result[c.id] = score.feasibilityPracticality || 0;
      else if (name.includes('market')) result[c.id] = score.marketImpactPotential || 0;
      else if (name.includes('technology')) result[c.id] = score.technologyDomainRelevance || 0;
      else if (name.includes('pitch')) result[c.id] = score.pitchDeliveryQA || 0;
      else result[c.id] = 0;
    });

    return result;
  };

  const refreshRound1Allocations = async () => {
    const allocations: any = await listAllocations();
    const round1AllocationMap = new Map<string, string[]>();
    allocations.forEach((allocation: any) => {
      const teamId = allocation.team.teamId;
      if (!round1AllocationMap.has(teamId)) {
        round1AllocationMap.set(teamId, []);
      }
      round1AllocationMap.get(teamId)!.push(allocation.judge.judgeId);
    });

    setTeams(prev => prev.map(team => ({
      ...team,
      allocatedJudges: {
        ...team.allocatedJudges,
        round1: round1AllocationMap.get(team.id) || []
      }
    })));
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadAdminData = async () => {
      try {
        console.log('🔄 Loading admin data...');
        const [domains, teamsResRaw, judgesRes] = await Promise.all([
          listDomains(),
          listTeams(),
          listJudges()
        ]);
        const teamsRes: any = teamsResRaw;
        
        console.log('✅ Backend data loaded:', {
          domains: domains?.length,
          teams: teamsRes?.length,
          judges: judgesRes?.length
        });

        const domainKeysLoaded = domains.map(d => d.key);

        let mappedTeams: Team[] = teamsRes.map((team: any) => ({
          id: team.teamId,
          teamName: team.name,
          eventId: 'event-1',
          members: (team.teamMembers || []).map((name: string) => ({ name, email: '', phone: '' })),
          domain: domainKeyToName.get(team.domainKey) || team.domainKey,
          problemStatement: team.problemStatement,
          qualificationStatus: 'Qualified',
          createdAt: team.createdAt,
          currentRound: 'Round 1',
          allocatedJudges: {}
        }));

        // Fetch allocations to map team allocations
        const allocationsRaw: any = await listAllocations();
        const allocations: any[] = allocationsRaw || [];
        const round1AllocationMap = new Map<string, string[]>();
        allocations.forEach((allocation: any) => {
          const teamId = allocation.team.teamId;
          if (!round1AllocationMap.has(teamId)) {
            round1AllocationMap.set(teamId, []);
          }
          round1AllocationMap.get(teamId)!.push(allocation.judge.judgeId);
        });

        const round2Allocations = await listRoundTwoAllocations().catch(() => []);
        const round2AllocationMap = new Map<string, string[]>();
        round2Allocations.forEach((allocation: any) => {
          const teamId = allocation.teamId;
          if (!round2AllocationMap.has(teamId)) {
            round2AllocationMap.set(teamId, []);
          }
          round2AllocationMap.get(teamId)!.push(allocation.judgeId);
        });

        mappedTeams = mappedTeams.map(team => ({
          ...team,
          allocatedJudges: {
            ...team.allocatedJudges,
            round1: round1AllocationMap.get(team.id) || [],
            round2: round2AllocationMap.get(team.id) || []
          }
        }));

        setTeams(mappedTeams);

        const mappedJudges: Judge[] = judgesRes.map(j => {
          const match = j.judgeId.match(/\d+/);
          const numericId = match ? Number(match[0]) : 0;
          const inferredType = numericId >= 11 ? 'External' : 'Internal';
          const type = j.judgeType || inferredType;
          return {
            backendId: j._id,
            id: j.judgeId,
            name: j.name,
            email: '',
            expertise: [],
            assignedEventIds: ['event-1'],
            type
          };
        });

        setJudges(mappedJudges);

        const allScores: Score[] = [];
        for (const key of domainKeysLoaded) {
          const domainScores = await listScores(key);
          domainScores.forEach((score) => {
            allScores.push({
              id: score._id,
              eventId: 'event-1',
              teamId: score.teamId,
              judgeId: score.judgeId,
              judgeName: score.judgeName,
              scores: mapApiScoreToCriteria('event-1', score),
              bonusScore: score.bonus,
              totalScore: score.total,
              remarks: '',
              submittedAt: score.createdAt,
              isFinalized: true,
              round: 'Round 1'
            });
          });
        }

        const roundTwoTeamsScoresRes: any = await listRoundTwoTeamsScores().catch(() => ({ teams: [] }));
        const roundTwoTeamsScores = Array.isArray(roundTwoTeamsScoresRes)
          ? roundTwoTeamsScoresRes
          : (roundTwoTeamsScoresRes?.teams || []);
        roundTwoTeamsScores.forEach((teamScore: any) => {
          teamScore.scores.forEach((score: any) => {
            allScores.push({
              id: `${teamScore.teamId}-${score.judgeId}-${score.createdAt}`,
              eventId: 'event-1',
              teamId: teamScore.teamId,
              judgeId: score.judgeId,
              judgeName: score.judgeName,
              scores: mapApiScoreToCriteria('event-1', score),
              bonusScore: score.bonus,
              totalScore: score.total,
              remarks: '',
              submittedAt: score.createdAt,
              isFinalized: true,
              round: 'Round 2'
            });
          });
        });

        setScores(allScores);
      } catch (error) {
        console.error('❌ Error loading admin data:', error);
        // fallback to mock data
      }
    };

    const loadJudgeData = async () => {
      try {
        const domains = await listDomains();
        const domainKeysLoaded = domains.map(d => d.key);

        const allocations = await listMyAllocations();
        const teamMap = new Map<string, Team>();

        allocations.forEach((allocation: any) => {
          const team = allocation?.team;
          if (!team?.teamId) return;
          if (teamMap.has(team.teamId)) return;

          teamMap.set(team.teamId, {
            id: team.teamId,
            teamName: team.name,
            eventId: 'event-1',
            members: [],
            domain: domainKeyToName.get(team.domainKey) || team.domainKey,
            problemStatement: team.problemStatement,
            qualificationStatus: 'Qualified',
            createdAt: allocation.createdAt,
            currentRound: 'Round 1',
            allocatedJudges: {
              round1: [currentUser.id]
            }
          });
        });

        setTeams(Array.from(teamMap.values()));

        const round2Allocations = await listRoundTwoAllocations().catch(() => []);
        const round2TeamMap = new Map<string, Team>();

        round2Allocations.forEach((allocation: any) => {
          const team = allocation?.team;
          if (!team?.name || !allocation?.teamId) return;
          if (round2TeamMap.has(allocation.teamId)) return;

          const domainName = domainKeyToName.get(team.domainKey) || team.domainKey;
          round2TeamMap.set(allocation.teamId, {
            id: allocation.teamId,
            teamName: team.name,
            eventId: 'event-1',
            members: [],
            domain: domainName || '',
            problemStatement: team.problemStatement,
            qualificationStatus: 'Qualified',
            createdAt: allocation.createdAt,
            currentRound: 'Round 2',
            allocatedJudges: {
              round2: [allocation.judgeId]
            }
          });
        });

        if (round2TeamMap.size > 0) {
          setTeams(prev => {
            const merged = new Map(prev.map(t => [t.id, t]));
            round2TeamMap.forEach((team, id) => merged.set(id, team));
            return Array.from(merged.values());
          });
        }

        const myScores: Score[] = [];
        for (const key of domainKeysLoaded) {
          const domainScores = await listMyScores(key).catch(() => []);
          domainScores.forEach((score) => {
            myScores.push({
              id: score._id,
              eventId: 'event-1',
              teamId: score.teamId,
              judgeId: score.judgeId,
              judgeName: score.judgeName,
              scores: mapApiScoreToCriteria('event-1', score),
              bonusScore: score.bonus,
              totalScore: score.total,
              remarks: '',
              submittedAt: score.createdAt,
              isFinalized: true,
              round: 'Round 1'
            });
          });
        }

        const roundTwoScores = await listMyRoundTwoScores().catch(() => []);
        roundTwoScores.forEach((score) => {
          myScores.push({
            id: score._id,
            eventId: 'event-1',
            teamId: score.teamId,
            judgeId: score.judgeId,
            judgeName: score.judgeName,
            scores: mapApiScoreToCriteria('event-1', score),
            bonusScore: score.bonus,
            totalScore: score.total,
            remarks: '',
            submittedAt: score.createdAt,
            isFinalized: true,
            round: 'Round 2'
          });
        });

        setScores(myScores);
      } catch (error) {
        // fallback to mock data
      }
    };

    if (currentUser.role === 'admin') {
      loadAdminData();
    } else {
      loadJudgeData();
    }
  }, [currentUser, domainKeyToName]);

  // Handle delete event
  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setTeams(prev => prev.filter(t => t.eventId !== eventId));
    setScores(prev => prev.filter(s => s.eventId !== eventId));
  };

  // Handle toggle event lock
  const handleToggleLock = (eventId: string) => {
    setEvents(prev =>
      prev.map(e => (e.id === eventId ? { ...e, isLocked: !e.isLocked } : e))
    );
  };

  // Handle submit score
  const handleSubmitScore = async (scoreData: Omit<Score, 'id' | 'submittedAt'>) => {
    const team = teams.find(t => t.id === scoreData.teamId);
    const domainKey = team ? (domainNameToKey.get(team.domain) || team.domain) : undefined;
    const round = scoreData.round || (currentUser?.judgeProfile?.type === 'External' ? 'Round 2' : 'Round 1');

    console.log('📤 Submitting score:', { teamId: scoreData.teamId, domainKey, round });

    try {
      if (round === 'Round 2') {
        await submitRoundTwoScore({
          teamId: scoreData.teamId,
          domainKey,
          ...mapScoreToPayload(scoreData.eventId, scoreData)
        } as any);
      } else {
        if (!domainKey) {
          throw new Error('Unable to determine domain key');
        }
        await submitScore({
          teamId: scoreData.teamId,
          domainKey,
          ...mapScoreToPayload(scoreData.eventId, scoreData)
        });
      }
      console.log('✅ Score submitted successfully');
    } catch (error: any) {
      console.error('❌ Error submitting score:', error?.message);
      alert(error?.message || 'Failed to submit score');
      throw error;
    }

    const newScore: Score = {
      ...scoreData,
      id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      round
    };

    // Check if score already exists
    const existingIndex = scores.findIndex(
      s =>
        s.eventId === newScore.eventId &&
        s.teamId === newScore.teamId &&
        s.judgeId === newScore.judgeId
    );

    if (existingIndex >= 0) {
      // Update existing score
      setScores(prev => {
        const updated = [...prev];
        updated[existingIndex] = newScore;
        return updated;
      });
    } else {
      // Add new score
      setScores(prev => [...prev, newScore]);
    }
  };

  // Handle update team allocation
  const handleUpdateTeamAllocation = (teamId: string, judgeIds: string[], round: RoundType) => {
    setTeams(prev =>
      prev.map(team => {
        if (team.id === teamId) {
          const roundKey = round === 'Round 1' ? 'round1' : 'round2';
          return {
            ...team,
            allocatedJudges: {
              ...team.allocatedJudges,
              [roundKey]: judgeIds
            }
          };
        }
        return team;
      })
    );
  };

  const handlePersistDomainAllocation = async (domainName: string, judgeIds: string[]) => {
    const domainKey = domainNameToKey.get(domainName) || domainName;
    await setDomainJudges({ domainKey, judgeIds });
    await refreshRound1Allocations();
  };

  const handleJudgeCreated = (judge: Judge) => {
    setJudges(prev => {
      const exists = prev.some(j => j.id === judge.id || j.backendId === judge.backendId);
      if (exists) return prev;
      return [...prev, judge];
    });
  };

  const handleJudgeUpdated = (judge: Judge) => {
    setJudges(prev =>
      prev.map(j => (j.backendId && judge.backendId && j.backendId === judge.backendId ? { ...j, ...judge } : j))
    );
  };

  const handleJudgeDeleted = (judgeId: string) => {
    setJudges(prev => prev.filter(j => j.id !== judgeId));
  };

  const refreshRound2AllocationsForTeams = async () => {
    const round2Allocations = await listRoundTwoAllocations().catch(() => []);
    const round2AllocationMap = new Map<string, string[]>();

    round2Allocations.forEach((allocation: any) => {
      const teamId = allocation?.teamId;
      if (!teamId) return;
      if (!round2AllocationMap.has(teamId)) {
        round2AllocationMap.set(teamId, []);
      }
      round2AllocationMap.get(teamId)!.push(allocation.judgeId);
    });

    setTeams(prev =>
      prev.map(team => ({
        ...team,
        allocatedJudges: {
          ...team.allocatedJudges,
          round2: round2AllocationMap.get(team.id) || []
        }
      }))
    );
  };

  // If not logged in, show login page
  if (!currentUser) {
    return (
      <LoginPage onLogin={handleLogin} />
    );
  }

  // Determine which component to render based on route
  const renderContent = () => {
    const path = location.pathname;

    if (currentUser.role === 'admin') {
      // Render admin pages with sidebar layout
      return (
        <AdminLayout onLogout={handleLogout}>
          {path === '/admin' || path === '/' ? (
            <DashboardOverview
              events={events}
              teams={teams}
              scores={scores}
              judges={judges}
            />
          ) : path === '/admin/quick-actions' ? (
            <QuickActionsPage />
          ) : path === '/admin/judge-management' ? (
            <JudgesManagement
              judges={judges}
              events={events}
              onJudgeCreated={handleJudgeCreated}
              onJudgeUpdated={handleJudgeUpdated}
              onJudgeDeleted={handleJudgeDeleted}
            />
          ) : path === '/admin/result-calculation' ? (
            <ResultCalculationPage
              teams={teams}
              scores={scores}
              judges={judges}
              onRefreshRound2Allocations={refreshRound2AllocationsForTeams}
            />
          ) : path === '/admin/export-results' ? (
            <ExportResultsPage
              events={events}
              teams={teams}
              scores={scores}
              judges={judges}
            />
          ) : path === '/admin/events' ? (
            <EventsList
              events={events}
              teams={teams}
              judges={judges}
              onDeleteEvent={handleDeleteEvent}
              onToggleLock={handleToggleLock}
            />
          ) : path === '/admin/results' ? (
            <ResultsView
              events={events}
              teams={teams}
              scores={scores}
            />
          ) : path === '/admin/teams' ? (
            <TeamsManagement
              events={events}
              teams={teams}
            />
          ) : path === '/admin/team-allocation' ? (
            (() => {
              const activeEvent = events.find(e => e.id === 'event-1');
              if (!activeEvent) {
                return <div className="text-slate-900">Event not found</div>;
              }
              return (
                <TeamAllocation
                  event={activeEvent}
                  teams={teams}
                  judges={judges}
                  scores={scores}
                  onUpdateTeamAllocation={handleUpdateTeamAllocation}
                  onPersistDomainAllocation={handlePersistDomainAllocation}
                />
              );
            })()
          ) : path === '/admin/allocation-view' ? (
            <AllocationView
              events={events}
              teams={teams}
              judges={judges}
              scores={scores}
            />
          ) : path === '/admin/live-updates' ? (
            <LiveUpdatesView
              scores={scores}
              teams={teams}
              judges={judges}
            />
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
              <p className="text-slate-600 mb-6">The page you're looking for doesn't exist.</p>
            </div>
          )}
        </AdminLayout>
      );
    } else if (currentUser.role === 'judge') {
      if (path === '/judge' || path === '/') {
        return (
          <JudgeDashboard
            currentUser={currentUser}
            events={events}
            teams={teams}
            scores={scores}
          />
        );
      } else if (path.startsWith('/judge/events/')) {
        return (
          <ScoringInterface
            currentUser={currentUser}
            events={events}
            teams={teams}
            scores={scores}
            onSubmitScore={handleSubmitScore}
          />
        );
      }
    }

    // Default: redirect to appropriate dashboard
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Page Not Found</h2>
        <p className="text-slate-600 mb-6">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate(currentUser.role === 'admin' ? '/admin' : '/judge')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
        >
          Go to Dashboard
        </button>
      </div>
    );
  };

  return (
    <>
      {currentUser.role === 'admin' ? (
        renderContent()
      ) : (
        <Layout currentUser={currentUser} onLogout={handleLogout}>
          {renderContent()}
        </Layout>
      )}
    </>
  );
}