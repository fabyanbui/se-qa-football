const TournamentModel = require('../models/tournament.m');
const TeamModel = require('../models/team.m');
const MatchModel = require('../models/match.m');
const PlayerModel = require('../models/player.m');

function getUser(req) {
  return req.isAuthenticated() ? req.user : null;
}

function normalizeRound(rawRound, totalRounds) {
  const parsedRound = Number.parseInt(rawRound, 10);
  if (!Number.isInteger(parsedRound) || parsedRound < 1) {
    return 1;
  }
  if (totalRounds > 0 && parsedRound > totalRounds) {
    return totalRounds;
  }
  return parsedRound;
}

function formatMatchDate(match) {
  const date = new Date(match.date);
  match.date = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function canConfigureTournament(user, tournament) {
  if (!user || !tournament) {
    return false;
  }
  if (user.isAdmin) {
    return true;
  }
  if (!user.canManageTournament) {
    return false;
  }
  return Number.parseInt(user.id, 10) === Number.parseInt(tournament.organizerId, 10);
}

function withTournamentPermissions(tournaments, user) {
  return tournaments.map((tournament) => ({
    ...tournament,
    canConfigure: canConfigureTournament(user, tournament),
  }));
}

async function loadTournamentMatch(matchId, tournamentId) {
  const match = await MatchModel.getMatchInTournament(matchId, tournamentId);
  if (!match) {
    return null;
  }

  formatMatchDate(match);
  const teams = await TeamModel.getTeamsLeaderboard(tournamentId);
  match.name1 = teams.find(t => t.id === match.teamId1)?.name;
  match.name2 = teams.find(t => t.id === match.teamId2)?.name;
  match.players1 = await PlayerModel.getAllPlayersFromTeam(match.teamId1);
  match.players2 = await PlayerModel.getAllPlayersFromTeam(match.teamId2);

  return { match, teams };
}

module.exports = {

  // GET /tournament
  getTournamentList: async function (req, res, next) {
    const user = getUser(req);
    try {
      const tournaments = await TournamentModel.getAllActiveTournaments();
      return res.render('tournament/list', {
        title: "Giải đấu",
        useTransHeader: false,
        user: user,
        tournaments: withTournamentPermissions(tournaments, user),
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /tournament/my
  getMyTournaments: async function (req, res, next) {
    const user = getUser(req);
    try {
      const tournaments = user.isAdmin
        ? await TournamentModel.getAllActiveTournaments()
        : await TournamentModel.getActiveTournamentsByOrganizer(user.id);
      return res.render('tournament/my-tournaments', {
        title: "Giải đấu của tôi",
        useTransHeader: false,
        user: user,
        tournaments: withTournamentPermissions(tournaments, user),
      });
    } catch (err) {
      return next(err);
    }
  },

  // GET /tournament/:tournamentId
  getTournament: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const teams = await TeamModel.getTeamsLeaderboard(tournament.id);
    const matches = await MatchModel.getMatchesInTournament(tournament.id);

    // only take 5 matches the most recent (both played and not played)
    matches.sort((a, b) => Math.abs(new Date(b.date) - new Date(a.date)));

    matches.forEach(match => {
      match.name1 = teams.find(t => t.id === match.teamId1)?.name;
      match.name2 = teams.find(t => t.id === match.teamId2)?.name;
    });

    const mostGoalsMatch = matches.length > 0
      ? matches.reduce((prev, curr) => (curr.scores1 + curr.scores2 > prev.scores1 + prev.scores2 ? curr : prev))
      : null;
    const players = await PlayerModel.getPlayersStatistics(tournament.id);

    res.render('tournament/tournament', {
      title: "Giải đấu",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: teams.length,
      teams: teams.slice(0, 5),
      matches: matches.slice(0, 5),
      stats: {
        totalPlayers: await TournamentModel.countPlayersInTournament(tournament.id),
        totalGoals: await MatchModel.getNumberOfGoalsInTournament(tournament.id),
        totalMatches: matches.length,
        ownGoals: await MatchModel.getNumberOfOwnGoalsInTournament(tournament.id),
        totalCards: await MatchModel.getNumberOfCardsInTournament(tournament.id),
        mostGoalsMatch: mostGoalsMatch,
        topScorers: players.slice(0, 3),
      },
      subNavigation: 0,
    });
  },

  // GET /tournament/:tournamentId/teams
  getTeams: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const teams = await TeamModel.getTeamsLeaderboard(tournament.id);

    res.render('tournament/teams', {
      title: "Danh sách đội",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      teams: teams,
      subNavigation: 1,
      subSubNavigation: 0,
    });
  },

  // GET /tournament/:tournamentId/teams/leaderboard
  getTeamsLeaderboard: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const teams = await TeamModel.getTeamsLeaderboard(tournament.id);

    res.render('tournament/teams-leaderboard', {
      title: "Bảng xếp hạng",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      teams: teams,
      subNavigation: 1,
      subSubNavigation: 1,
    });
  },

  // GET /tournament/:tournamentId/matches?round=
  getMatches: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const rounds = await MatchModel.getRoundsInTournament(tournament.id);
    const round = normalizeRound(req.query.round, rounds.length);
    const matches = rounds[round - 1] || [];
    const countMatches = rounds.reduce((sum, currentRound) => sum + currentRound.length, 0);

    // group matches by date
    const dates = [];
    const teams = await TeamModel.getAllActiveTeams(tournament.id);
    for (const match of matches) {
      match.name1 = teams.find(t => t.id === match.teamId1)?.name;
      match.name2 = teams.find(t => t.id === match.teamId2)?.name;
      const date = dates.find(d => d.date === match.date);
      if (!date) {
        dates.push({ date: match.date, matches: [match] });
      } else {
        date.matches.push(match);
      }
    }

    res.render('tournament/matches', {
      title: "Lịch thi đấu",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      round: round,
      rounds: rounds,
      countAllMatches: countMatches,
      dates: dates,
      subNavigation: 2,
    });
  },

  // GET /tournament/:tournamentId/statistics
  getStatistics: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const teams = await TeamModel.getTeamsLeaderboard(tournament.id);

    res.render('tournament/statistics', {
      title: "Thống kê",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      teams: teams,
      subNavigation: 3,
      subSubNavigation: 0,
    });
  },

  // GET /tournament/:tournamentId/statistics/players
  getStatisticsPlayers: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const players = await PlayerModel.getPlayersStatistics(tournament.id);

    res.render('tournament/statistics-players', {
      title: "Thống kê",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      players: players,
      subNavigation: 3,
      subSubNavigation: 1,
    });
  },

  // GET /tournament/:tournamentId/modifications
  getModifications: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;

    res.render('tournament/modifications', {
      title: "Chỉnh sửa",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      subNavigation: 4,
      subSubNavigation: 0,
    });
  },

  // POST /tournament/:tournamentId/modifications/info
  postModificationsInfo: async function (req, res) {
    const tournament = req.tournament;
    const info = req.body;

    await TournamentModel.updateInfo(tournament.id, info);
    res.json({ status: 'success' });
  },

  // POST /tournament/:tournamentId/modifications/logo
  posModificationsLogo: async function (req, res) {
    res.json({ status: 'success' });
  },

  // POST /tournament/:tournamentId/modifications/banner
  postModificationsBanner: async function (req, res) {
    res.json({ status: 'success' });
  },

  // GET /tournament/:tournamentId/modifications/teams
  getTeamsModifications: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const teams = await TeamModel.getAllCurrentTeams(tournament.id);

    // remove all teams that has no team.profile
    for (let i = 0; i < teams.length; i++) {
      if (!teams[i].profile) {
        teams.splice(i, 1);
        i--;
      }
    }

    res.render('tournament/modifications-teams', {
      title: "Chỉnh sửa",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      teams: teams,
      subNavigation: 4,
      subSubNavigation: 1,
    });
  },

  // GET /tournament/:tournamentId/modifications/matches
  getMatchesModifications: async function (req, res) {
    const user = getUser(req);
    const tournament = req.tournament;
    const rounds = await MatchModel.getRoundsInTournament(tournament.id);
    const round = normalizeRound(req.query.round, rounds.length);
    const matches = rounds[round - 1] || [];
    const teams = await TeamModel.getAllActiveTeams(tournament.id);

    res.render('tournament/modifications-matches', {
      title: "Chỉnh sửa",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      nOfActiveTeams: await TournamentModel.countActiveTeamsInTournament(tournament.id),
      round: round,
      rounds: rounds,
      matches: matches,
      teams: teams,
      subNavigation: 4,
      subSubNavigation: 2,
    });
  },

  // GET /tournament/:tournamentId/matches/:id
  getMatchById: async function (req, res, next) {
    const user = getUser(req);
    const tournament = req.tournament;
    const matchId = req.params.id;
    const matchData = await loadTournamentMatch(matchId, tournament.id);
    if (!matchData) {
      return next();
    }

    const { match, teams } = matchData;
    match.players = [];
    match.players.length = Math.max(match.players1.length, match.players2.length);

    return res.render('tournament/matches/match', {
      title: "Trận đấu",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      match: match,
      teams: teams.slice(0, 5),
      subNavigation: 0,
    });
  },

  // GET /tournament/:tournamentId/matches/:id/edit
  getMatchByIdEdit: async function (req, res, next) {
    const user = getUser(req);
    const tournament = req.tournament;
    const matchId = req.params.id;
    const matchData = await loadTournamentMatch(matchId, tournament.id);
    if (!matchData) {
      return next();
    }

    const { match } = matchData;
    match.players = [...match.players1, ...match.players2];

    // push match.ownGoals1 and match.ownGoals2 and match.goals1 and match.goals2 to match.goals
    match.goals = [];
    match.ownGoals1.forEach(goal => { goal.isOwnGoal = true; match.goals.push(goal); });
    match.ownGoals2.forEach(goal => { goal.isOwnGoal = true; match.goals.push(goal); });
    match.goals1.forEach(goal => { goal.isOwnGoal = false; match.goals.push(goal); });
    match.goals2.forEach(goal => { goal.isOwnGoal = false; match.goals.push(goal); });

    // sort match.goals by time
    match.goals.sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });

    // push match.yellowCards1 and match.yellowCards2 and match.redCards1 and match.redCards2 to match.cards
    match.cards = [];
    match.yellowCards1.forEach(card => { card.isRedCard = false; match.cards.push(card); });
    match.yellowCards2.forEach(card => { card.isRedCard = false; match.cards.push(card); });
    match.redCards1.forEach(card => { card.isRedCard = true; match.cards.push(card); });
    match.redCards2.forEach(card => { card.isRedCard = true; match.cards.push(card); });

    // sort match.cards by time
    match.cards.sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time > b.time) return 1;
      return 0;
    });

    return res.render('tournament/matches/match-edit', {
      title: "Chỉnh sửa trận đấu",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      match: match,
      subNavigation: 1,
      subSubNavigation: 0,
    });
  },

  // POST /tournament/:tournamentId/matches/:id/edit/goals
  addNewGoal: async function (req, res) {
    const tournament = req.tournament;
    const goal = { ...req.body, matchId: req.params.id };

    try {
      const match = await MatchModel.getMatchInTournament(goal.matchId, tournament.id);
      if (!match) {
        return res.status(404).json({ status: 'error' });
      }

      await MatchModel.addNewGoal(goal);
      return res.json({ status: 'success' });
    } catch (error) {
      console.log(error);
      return res.json({ status: 'error' });
    }
  },

  // POST /tournament/:tournamentId/matches/:id/edit/cards
  addNewCard: async function (req, res) {
    const tournament = req.tournament;
    const card = { ...req.body, matchId: req.params.id };

    try {
      const match = await MatchModel.getMatchInTournament(card.matchId, tournament.id);
      if (!match) {
        return res.status(404).json({ status: 'error' });
      }

      await MatchModel.addNewCard(card);
      return res.json({ status: 'success' });
    } catch (error) {
      console.log(error);
      return res.json({ status: 'error' });
    }
  },

  // GET /tournament/:tournamentId/matches/:id/edit/players
  getMatchByIdEditPlayers: async function (req, res, next) {
    const user = getUser(req);
    const tournament = req.tournament;
    const matchId = req.params.id;
    const matchData = await loadTournamentMatch(matchId, tournament.id);
    if (!matchData) {
      return next();
    }

    const { match } = matchData;
    match.players = [...match.players1, ...match.players2];

    return res.render('tournament/matches/match-edit-players', {
      title: "Chỉnh sửa trận đấu",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      match: match,
      subNavigation: 1,
      subSubNavigation: 1,
    });
  },

  // GET /tournament/:tournamentId/matches/:id/edit/tickets => Not implement
  getMatchByIdEditTickets: async function (req, res, next) {
    const user = getUser(req);
    const tournament = req.tournament;
    const matchId = req.params.id;
    const matchData = await loadTournamentMatch(matchId, tournament.id);
    if (!matchData) {
      return next();
    }

    const { match } = matchData;
    match.players = [...match.players1, ...match.players2];

    return res.render('tournament/matches/match-edit-tickets', {
      title: "Chỉnh sửa trận đấu",
      useTransHeader: true,
      user: user,
      tournament: tournament,
      match: match,
      subNavigation: 1,
      subSubNavigation: 2,
    });
  },

  // PUT /tournament/:tournamentId/modifications/teams/:teamId/accept
  putModificationsTeamsAccept: async function (req, res) {
    const tournament = req.tournament;
    const teamId = req.params.teamId;

    try {
      const team = await TeamModel.getTeam(teamId);
      if (!team || Number(team.tournamentId) !== Number(tournament.id)) {
        throw new Error('Không tìm thấy đội bóng trong giải đấu này');
      }
      if (!team.profile) {
        throw new Error('Chưa có hồ sơ đội bóng');
      }
      if (team.status) {
        throw new Error('Đội bóng đã được chấp nhận');
      }

      const updatedCount = await TeamModel.updateTeamStatus(teamId, true, tournament.id);
      if (updatedCount === 0) {
        throw new Error('Số lượng đội đã đạt tối đa hoặc không thể cập nhật');
      }

      return res.json({ status: 'success' });
    } catch (error) {
      console.log(error);
      return res.json({ status: 'error' });
    }
  },

  // PUT /tournament/:tournamentId/modifications/teams/:teamId/reject
  putModificationsTeamsReject: async function (req, res) {
    const tournament = req.tournament;
    const teamId = req.params.teamId;

    try {
      const team = await TeamModel.getTeam(teamId);
      if (!team || Number(team.tournamentId) !== Number(tournament.id)) {
        throw new Error('Không tìm thấy đội bóng trong giải đấu này');
      }
      if (!team.profile) {
        throw new Error('Chưa có hồ sơ đội bóng');
      }
      if (!team.status) {
        throw new Error('Đội bóng chưa được chấp nhận sẵn rồi');
      }

      const updatedCount = await TeamModel.updateTeamStatus(teamId, false, tournament.id);
      if (updatedCount === 0) {
        throw new Error('Không thể cập nhật trạng thái đội bóng');
      }

      return res.json({ status: 'success' });
    } catch (error) {
      console.log(error);
      return res.json({ status: 'error' });
    }
  },

  // PUT /tournament/:tournamentId/modifications/matches
  putModificationsMatches: async function (req, res) {
    const tournament = req.tournament;
    const matches = req.body.matches;

    try {
      if (!Array.isArray(matches)) {
        throw new Error('Dữ liệu trận đấu không hợp lệ');
      }

      for (const match of matches) {
        const scopedMatch = await MatchModel.getMatchInTournament(match.id, tournament.id);
        if (!scopedMatch) {
          throw new Error('Có trận đấu không thuộc giải đấu hiện tại');
        }
        await MatchModel.shortUpdateMatch(match.id, match);
      }
      return res.json({ status: 'success' });
    } catch (error) {
      console.log(error);
      return res.json({ status: 'error' });
    }
  },

};
